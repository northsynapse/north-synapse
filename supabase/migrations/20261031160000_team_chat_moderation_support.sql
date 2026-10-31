-- North Synapse: private team chat, pinned announcements, moderation, support, and audit logs
-- 中文注释：团队聊天及管理功能的数据库结构与服务端权限。

create table if not exists public.team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists team_chat_messages_created_idx on public.team_chat_messages(created_at desc);

create table if not exists public.team_chat_announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  content text not null check (char_length(trim(content)) between 1 and 8000),
  is_pinned boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_chat_announcements_pinned_idx on public.team_chat_announcements(is_pinned desc, created_at desc);

create table if not exists public.team_chat_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('resource','discussion','reply','profile','message')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 3000),
  status text not null default 'Pending' check (status in ('Pending','Reviewing','Resolved','Dismissed')),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_reports_status_idx on public.content_reports(status,created_at desc);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 1 and 180),
  message text not null check (char_length(trim(message)) between 1 and 8000),
  status text not null default 'Open' check (status in ('Open','In Progress','Resolved','Closed')),
  staff_reply text,
  handled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_status_idx on public.support_tickets(status,created_at desc);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs(created_at desc);

alter table public.team_chat_messages enable row level security;
alter table public.team_chat_announcements enable row level security;
alter table public.team_chat_reads enable row level security;
alter table public.content_reports enable row level security;
alter table public.support_tickets enable row level security;
alter table public.admin_activity_logs enable row level security;

drop policy if exists "Team can read chat messages" on public.team_chat_messages;
create policy "Team can read chat messages" on public.team_chat_messages for select to authenticated
using (public.is_current_user_admin() or public.is_current_user_team());
drop policy if exists "Team can send chat messages" on public.team_chat_messages;
create policy "Team can send chat messages" on public.team_chat_messages for insert to authenticated
with check (user_id = auth.uid() and (public.is_current_user_admin() or public.is_current_user_team()));
drop policy if exists "Authors and core team can update chat messages" on public.team_chat_messages;
create policy "Authors and core team can update chat messages" on public.team_chat_messages for update to authenticated
using (user_id = auth.uid() or public.has_team_permission('activity_logs'))
with check (user_id = auth.uid() or public.has_team_permission('activity_logs'));
drop policy if exists "Authors and core team can delete chat messages" on public.team_chat_messages;
create policy "Authors and core team can delete chat messages" on public.team_chat_messages for delete to authenticated
using (user_id = auth.uid() or public.has_team_permission('activity_logs'));

drop policy if exists "Team can read pinned announcements" on public.team_chat_announcements;
create policy "Team can read pinned announcements" on public.team_chat_announcements for select to authenticated
using (public.is_current_user_admin() or public.is_current_user_team());
drop policy if exists "Team can publish announcements" on public.team_chat_announcements;
create policy "Team can publish announcements" on public.team_chat_announcements for insert to authenticated
with check (author_id = auth.uid() and (public.is_current_user_admin() or public.is_current_user_team()));
drop policy if exists "Team can manage announcements" on public.team_chat_announcements;
create policy "Team can manage announcements" on public.team_chat_announcements for update to authenticated
using (public.is_current_user_admin() or public.is_current_user_team())
with check (public.is_current_user_admin() or public.is_current_user_team());
drop policy if exists "Core team can delete announcements" on public.team_chat_announcements;
create policy "Core team can delete announcements" on public.team_chat_announcements for delete to authenticated
using (public.has_team_permission('activity_logs'));

drop policy if exists "Users manage own chat read marker" on public.team_chat_reads;
create policy "Users manage own chat read marker" on public.team_chat_reads for all to authenticated
using (user_id = auth.uid() and (public.is_current_user_admin() or public.is_current_user_team()))
with check (user_id = auth.uid() and (public.is_current_user_admin() or public.is_current_user_team()));

drop policy if exists "Users create own reports" on public.content_reports;
create policy "Users create own reports" on public.content_reports for insert to authenticated
with check (reporter_id = auth.uid());
drop policy if exists "Reporters and moderators read reports" on public.content_reports;
create policy "Reporters and moderators read reports" on public.content_reports for select to authenticated
using (reporter_id = auth.uid() or public.has_team_permission('moderation'));
drop policy if exists "Moderators update reports" on public.content_reports;
create policy "Moderators update reports" on public.content_reports for update to authenticated
using (public.has_team_permission('moderation')) with check (public.has_team_permission('moderation'));

drop policy if exists "Users create own support tickets" on public.support_tickets;
create policy "Users create own support tickets" on public.support_tickets for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "Users and support team read tickets" on public.support_tickets;
create policy "Users and support team read tickets" on public.support_tickets for select to authenticated
using (user_id = auth.uid() or public.has_team_permission('support'));
drop policy if exists "Support team update tickets" on public.support_tickets;
create policy "Support team update tickets" on public.support_tickets for update to authenticated
using (public.has_team_permission('support')) with check (public.has_team_permission('support'));

drop policy if exists "Core team reads activity logs" on public.admin_activity_logs;
create policy "Core team reads activity logs" on public.admin_activity_logs for select to authenticated
using (public.has_team_permission('activity_logs'));
revoke insert, update, delete on public.admin_activity_logs from anon, authenticated;

grant select, insert, update, delete on public.team_chat_messages to authenticated;
grant select, insert, update, delete on public.team_chat_announcements to authenticated;
grant select, insert, update, delete on public.team_chat_reads to authenticated;
grant select, insert, update on public.content_reports to authenticated;
grant select, insert, update on public.support_tickets to authenticated;
grant select on public.admin_activity_logs to authenticated;

-- 用户管理仅允许管理员和 Core Team 读取账号目录；邮箱仅在该受限 RPC 中返回。
create or replace function public.team_user_directory(p_search text default '')
returns table(user_id uuid, email text, username text, nickname text, created_at timestamptz, team_role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_permission('users') then raise exception 'User management permission required'; end if;
  return query
    select u.id, u.email,
      coalesce(p.username, split_part(coalesce(u.email,''),'@',1)),
      coalesce(p.nickname, p.username, split_part(coalesce(u.email,''),'@',1)),
      u.created_at, tm.role
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.team_members tm on tm.user_id = u.id
    where coalesce(u.email,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.username,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.nickname,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
    order by u.created_at desc limit 100;
end;
$$;
revoke all on function public.team_user_directory(text) from public;
grant execute on function public.team_user_directory(text) to authenticated;

-- 管理操作日志通过服务端函数写入，前端不能直接伪造或修改日志。
create or replace function public.log_team_management_action(
  p_action text, p_target_user_id uuid, p_details jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  insert into public.admin_activity_logs(actor_id, action, target_user_id, details)
  values(auth.uid(), p_action, p_target_user_id, coalesce(p_details,'{}'::jsonb));
end;
$$;
revoke all on function public.log_team_management_action(text,uuid,jsonb) from public;
grant execute on function public.log_team_management_action(text,uuid,jsonb) to authenticated;

-- 将团队管理操作纳入审计日志。
create or replace function public.admin_manage_team_member(
  p_email text, p_action text, p_role text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_target_id uuid;
  v_email text := lower(trim(coalesce(p_email,'')));
  v_old_role text;
  v_event text;
  v_title text;
  v_message text;
  v_permissions jsonb;
begin
  if v_admin_id is null or not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if v_email = '' then raise exception 'Email address is required'; end if;
  if p_action not in ('add','update','remove') then raise exception 'Invalid action'; end if;
  if p_action in ('add','update') and p_role not in ('core_team','community_team') then raise exception 'Invalid team role'; end if;

  select u.id into v_target_id from auth.users u where lower(u.email)=v_email limit 1;
  if v_target_id is null then raise exception 'No registered account was found for this email'; end if;
  if exists(select 1 from public.admin_users a where a.user_id=v_target_id) then raise exception 'Administrator accounts cannot be changed'; end if;
  select tm.role into v_old_role from public.team_members tm where tm.user_id=v_target_id;

  if p_action='remove' then
    if v_old_role is null then raise exception 'This account is not a team member'; end if;
    v_event := 'removed'; v_title := 'Your team membership has changed';
    v_message := 'Your North Synapse team membership has been removed. Your account remains a regular user account.';
    v_permissions := '[]'::jsonb;
    insert into public.team_notifications(user_id,event_type,previous_role,new_role,title,message,permissions)
    values(v_target_id,v_event,v_old_role,null,v_title,v_message,v_permissions);
    delete from public.team_members where user_id=v_target_id;
  else
    if v_old_role is null then v_event := 'added';
    elsif v_old_role=p_role then raise exception 'This account already has that team role';
    elsif p_role='core_team' then v_event := 'promoted';
    else v_event := 'demoted'; end if;
    insert into public.team_members(user_id,role,added_by,updated_at)
    values(v_target_id,p_role,v_admin_id,now())
    on conflict(user_id) do update set role=excluded.role,added_by=excluded.added_by,updated_at=now();

    if p_role='core_team' then
      v_title := case when v_event='added' then 'Welcome to the North Synapse Core Team' else 'Your team role has been updated' end;
      v_message := 'You are now a Core Team member. You can view platform statistics, process reports, manage user accounts, handle user support, and view administrative activity logs.';
      v_permissions := '["View platform statistics","Review and process user reports","Manage user accounts","Handle user support requests","View administrative activity logs"]'::jsonb;
    else
      v_title := case when v_event='added' then 'Welcome to the North Synapse Community Team' else 'Your team role has been updated' end;
      v_message := 'You are now a Community Team member. You can view platform statistics, process reports, and handle user support requests.';
      v_permissions := '["View platform statistics","Review and process user reports","Handle user support requests"]'::jsonb;
    end if;
    insert into public.team_notifications(user_id,event_type,previous_role,new_role,title,message,permissions)
    values(v_target_id,v_event,v_old_role,p_role,v_title,v_message,v_permissions);
  end if;

  insert into public.admin_activity_logs(actor_id,action,target_user_id,details)
  values(v_admin_id,'team_member_'||p_action,v_target_id,jsonb_build_object('previous_role',v_old_role,'new_role',case when p_action='remove' then null else p_role end,'email',v_email));
  return jsonb_build_object('user_id',v_target_id,'email',v_email,'previous_role',v_old_role,'role',case when p_action='remove' then null else p_role end,'action',p_action);
end;
$$;
revoke all on function public.admin_manage_team_member(text,text,text) from public;
grant execute on function public.admin_manage_team_member(text,text,text) to authenticated;

-- 新消息和公告启用 Supabase Realtime。
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_chat_messages') then
    alter publication supabase_realtime add table public.team_chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_chat_announcements') then
    alter publication supabase_realtime add table public.team_chat_announcements;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_notifications') then
    alter publication supabase_realtime add table public.team_notifications;
  end if;
end $$;

notify pgrst, 'reload schema';
