-- North Synapse complete Team System setup.
-- 中文注释：将本文件完整内容一次性粘贴到 Supabase SQL Editor 执行。
-- 此整合文件包含团队角色、通知、管理面板、群聊、举报、支持、徽章及审计日志。
-- 建议先在测试项目执行；重复执行以 CREATE IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS 为主。

begin;

-- =========================================================
-- Included migration: supabase/migrations/20261031150000_team_roles_and_notifications.sql
-- =========================================================
-- North Synapse team roles, membership management, and persistent notifications
-- 所有团队身份变更均通过受保护的数据库函数执行，并生成持久化通知。

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('core_team', 'community_team')),
  badge_visible boolean not null default true,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_role_idx
  on public.team_members(role, created_at desc);

create table if not exists public.team_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('added', 'promoted', 'demoted', 'removed')),
  previous_role text,
  new_role text,
  title text not null,
  message text not null,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists team_notifications_user_pending_idx
  on public.team_notifications(user_id, created_at desc)
  where read_at is null;

alter table public.team_members enable row level security;
alter table public.team_notifications enable row level security;

create or replace function public.current_team_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select tm.role
  from public.team_members tm
  where tm.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function public.is_current_user_team()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_team_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select public.is_current_user_admin())
    or case
      when (select public.current_team_role()) = 'core_team'
        then p_permission in ('statistics', 'moderation', 'users', 'support', 'activity_logs', 'team_chat', 'team_announcements')
      when (select public.current_team_role()) = 'community_team'
        then p_permission in ('statistics', 'moderation', 'support', 'team_chat', 'team_announcements')
      else false
    end;
$$;

revoke all on function public.current_team_role() from public;
revoke all on function public.is_current_user_team() from public;
revoke all on function public.has_team_permission(text) from public;
grant execute on function public.current_team_role() to authenticated;
grant execute on function public.is_current_user_team() to authenticated;
grant execute on function public.has_team_permission(text) to authenticated;

drop policy if exists "Team members can view team directory" on public.team_members;
create policy "Team members can view team directory"
  on public.team_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_current_user_admin())
    or (select public.is_current_user_team())
  );

drop policy if exists "Users can read own team notifications" on public.team_notifications;
create policy "Users can read own team notifications"
  on public.team_notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can acknowledge own team notifications" on public.team_notifications;
create policy "Users can acknowledge own team notifications"
  on public.team_notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke insert, delete on public.team_members from anon, authenticated;
revoke insert, delete on public.team_notifications from anon, authenticated;
grant select on public.team_members to authenticated;
grant select, update (read_at) on public.team_notifications to authenticated;

-- 管理员通过邮箱添加、调整或移除团队成员；所有变更都会留下可追踪的通知。
create or replace function public.admin_manage_team_member(
  p_email text,
  p_action text,
  p_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_target_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_old_role text;
  v_event text;
  v_title text;
  v_message text;
  v_permissions jsonb;
begin
  if v_admin_id is null or not (select public.is_current_user_admin()) then
    raise exception 'Administrator access required';
  end if;

  if v_email = '' then raise exception 'Email address is required'; end if;
  if p_action not in ('add', 'update', 'remove') then
    raise exception 'Invalid team management action';
  end if;
  if p_action in ('add', 'update') and p_role not in ('core_team', 'community_team') then
    raise exception 'Invalid team role';
  end if;

  select u.id into v_target_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_target_id is null then
    raise exception 'No registered account was found for this email';
  end if;

  if exists (select 1 from public.admin_users a where a.user_id = v_target_id) then
    raise exception 'Administrator accounts cannot be changed through team management';
  end if;

  select tm.role into v_old_role
  from public.team_members tm
  where tm.user_id = v_target_id;

  if p_action = 'remove' then
    if v_old_role is null then raise exception 'This account is not a team member'; end if;
    v_event := 'removed';
    v_title := 'Your team membership has changed';
    v_message := 'Your North Synapse team membership has been removed. Your account remains a regular user account.';
    v_permissions := '[]'::jsonb;

    insert into public.team_notifications(user_id, event_type, previous_role, new_role, title, message, permissions)
    values (v_target_id, v_event, v_old_role, null, v_title, v_message, v_permissions);

    delete from public.team_members where user_id = v_target_id;
  else
    if v_old_role is null then
      v_event := 'added';
    elsif v_old_role = p_role then
      raise exception 'This account already has that team role';
    elsif p_role = 'core_team' then
      v_event := 'promoted';
    else
      v_event := 'demoted';
    end if;

    insert into public.team_members(user_id, role, added_by, updated_at)
    values (v_target_id, p_role, v_admin_id, now())
    on conflict (user_id) do update
      set role = excluded.role,
          added_by = excluded.added_by,
          updated_at = now();

    if p_role = 'core_team' then
      v_title := case when v_event = 'added' then 'Welcome to the North Synapse Core Team' else 'Your team role has been updated' end;
      v_message := 'You are now a Core Team member. You can view platform statistics, process reports, manage user accounts, handle user support, and view administrative activity logs.';
      v_permissions := '["View platform statistics","Review and process user reports","Manage user accounts","Handle user support requests","View administrative activity logs"]'::jsonb;
    else
      v_title := case when v_event = 'added' then 'Welcome to the North Synapse Community Team' else 'Your team role has been updated' end;
      v_message := 'You are now a Community Team member. You can view platform statistics, process reports, and handle user support requests.';
      v_permissions := '["View platform statistics","Review and process user reports","Handle user support requests"]'::jsonb;
    end if;

    insert into public.team_notifications(user_id, event_type, previous_role, new_role, title, message, permissions)
    values (v_target_id, v_event, v_old_role, p_role, v_title, v_message, v_permissions);
  end if;

  return jsonb_build_object(
    'user_id', v_target_id,
    'email', v_email,
    'previous_role', v_old_role,
    'role', case when p_action = 'remove' then null else p_role end,
    'action', p_action
  );
end;
$$;

revoke all on function public.admin_manage_team_member(text, text, text) from public;
grant execute on function public.admin_manage_team_member(text, text, text) to authenticated;

-- 成员只能修改自己的公开标识显示状态，不能修改团队角色或权限。
create or replace function public.set_own_team_badge_visibility(p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.team_members
  set badge_visible = p_visible, updated_at = now()
  where user_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.set_own_team_badge_visibility(boolean) from public;
grant execute on function public.set_own_team_badge_visibility(boolean) to authenticated;

notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031160000_team_chat_moderation_support.sql
-- =========================================================
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

-- =========================================================
-- Included migration: supabase/migrations/20261031170000_team_badge_admin_control.sql
-- =========================================================
-- 管理员可以为团队成员调整公开标识；此设置不改变成员权限。
create or replace function public.admin_set_team_badge_visibility(p_user_id uuid, p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;
  update public.team_members
  set badge_visible = p_visible, updated_at = now()
  where user_id = p_user_id;
  if not found then raise exception 'Team member not found'; end if;
  insert into public.admin_activity_logs(actor_id, action, target_user_id, details)
  values(auth.uid(), 'team_badge_visibility_changed', p_user_id, jsonb_build_object('visible', p_visible));
  return true;
end;
$$;
revoke all on function public.admin_set_team_badge_visibility(uuid,boolean) from public;
grant execute on function public.admin_set_team_badge_visibility(uuid,boolean) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031180000_team_statistics_and_public_badges.sql
-- =========================================================
-- 团队统计权限与公开团队徽章查询
create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.has_team_permission('statistics') then
    raise exception 'Platform statistics permission required';
  end if;
  select jsonb_build_object(
    'registered_users', (select count(*) from auth.users),
    'online_users', (select count(*) from public.user_presence where last_seen_at > now() - interval '2 minutes'),
    'average_rating', (select coalesce(round(avg(rating)::numeric,2),0) from public.site_ratings),
    'rating_count', (select count(*) from public.site_ratings),
    'pending_feedback', (select count(*) from public.site_feedback where status='Pending'),
    'total_feedback', (select count(*) from public.site_feedback),
    'pending_reports', (select count(*) from public.content_reports where status='Pending'),
    'open_support_tickets', (select count(*) from public.support_tickets where status in ('Open','In Progress'))
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_dashboard_metrics() from public;
grant execute on function public.admin_dashboard_metrics() to authenticated;

create or replace function public.public_team_badge(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when tm.badge_visible then tm.role else null end
  from public.team_members tm
  where tm.user_id = p_user_id
  limit 1;
$$;
revoke all on function public.public_team_badge(uuid) from public;
grant execute on function public.public_team_badge(uuid) to authenticated;

notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031190000_team_admin_identity_realtime.sql
-- =========================================================
-- 为群聊身份标签提供仅返回布尔值的管理员身份查询。
create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admin_users a where a.user_id = p_user_id); $$;
revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

-- 团队成员角色变更通过 Realtime 同步到在线用户。
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_members') then
    alter publication supabase_realtime add table public.team_members;
  end if;
end $$;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031200000_include_admins_in_team_directory.sql
-- =========================================================
-- 管理员账号也出现在团队目录中，但不允许通过普通团队管理操作修改。
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
      u.created_at,
      case when a.user_id is not null then 'administrator' else tm.role end
    from auth.users u
    left join public.profiles p on p.id=u.id
    left join public.team_members tm on tm.user_id=u.id
    left join public.admin_users a on a.user_id=u.id
    where (coalesce(u.email,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.username,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.nickname,'') ilike '%' || trim(coalesce(p_search,'')) || '%')
      and (a.user_id is not null or tm.user_id is not null)
    order by case when a.user_id is not null then 0 else 1 end, u.created_at desc
    limit 100;
end;
$$;
revoke all on function public.team_user_directory(text) from public;
grant execute on function public.team_user_directory(text) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031220000_admin_team_badge_visibility.sql
-- =========================================================
-- 管理员同样拥有默认公开的团队标识，并可自行隐藏。
alter table public.admin_users add column if not exists badge_visible boolean not null default true;

create or replace function public.public_team_badge(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists(select 1 from public.admin_users a where a.user_id=p_user_id and a.badge_visible) then 'administrator'
    when exists(select 1 from public.team_members tm where tm.user_id=p_user_id and tm.badge_visible and tm.role='core_team') then 'core_team'
    when exists(select 1 from public.team_members tm where tm.user_id=p_user_id and tm.badge_visible and tm.role='community_team') then 'community_team'
    else null
  end;
$$;

create or replace function public.set_own_team_badge_visibility(p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.team_members set badge_visible=p_visible, updated_at=now() where user_id=auth.uid();
  if found then return true; end if;
  update public.admin_users set badge_visible=p_visible where user_id=auth.uid();
  return found;
end;
$$;
revoke all on function public.public_team_badge(uuid) from public;
grant execute on function public.public_team_badge(uuid) to authenticated;
revoke all on function public.set_own_team_badge_visibility(boolean) from public;
grant execute on function public.set_own_team_badge_visibility(boolean) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031230000_team_activity_logging_rpc.sql
-- =========================================================
-- 由服务端验证权限后记录团队处理操作，客户端不能直接写入审计表。
create or replace function public.record_team_activity(
  p_action text,
  p_target_user_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action like 'report_%' then
    if not public.has_team_permission('moderation') then raise exception 'Moderation permission required'; end if;
  elsif p_action like 'support_%' then
    if not public.has_team_permission('support') then raise exception 'Support permission required'; end if;
  else
    raise exception 'Unsupported activity type';
  end if;
  insert into public.admin_activity_logs(actor_id,action,target_user_id,details)
  values(auth.uid(),p_action,p_target_user_id,coalesce(p_details,'{}'::jsonb));
end;
$$;
revoke all on function public.record_team_activity(text,uuid,jsonb) from public;
grant execute on function public.record_team_activity(text,uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031240000_current_team_badge_visibility.sql
-- =========================================================
create or replace function public.current_team_badge_visible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select tm.badge_visible from public.team_members tm where tm.user_id=auth.uid()),
    (select a.badge_visible from public.admin_users a where a.user_id=auth.uid()),
    true
  );
$$;
revoke all on function public.current_team_badge_visible() from public;
grant execute on function public.current_team_badge_visible() to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031250000_content_moderation_hide.sql
-- =========================================================
-- 举报处理支持隐藏违规内容；原始记录保留，团队可继续查看。
alter table public.resources add column if not exists moderation_hidden boolean not null default false;
alter table public.discussions add column if not exists moderation_hidden boolean not null default false;
alter table public.discussion_replies add column if not exists moderation_hidden boolean not null default false;
alter table public.resource_comments add column if not exists moderation_hidden boolean not null default false;

drop policy if exists "Authenticated users can read resources" on public.resources;
create policy "Authenticated users can read visible resources" on public.resources
for select to authenticated using (not moderation_hidden or public.has_team_permission('moderation'));

drop policy if exists "Authenticated users can read discussions" on public.discussions;
create policy "Authenticated users can read visible discussions" on public.discussions
for select to authenticated using (not moderation_hidden or public.has_team_permission('moderation'));

drop policy if exists "Authenticated users can read discussion replies" on public.discussion_replies;
create policy "Authenticated users can read visible discussion replies" on public.discussion_replies
for select to authenticated using (not moderation_hidden or public.has_team_permission('moderation'));

drop policy if exists "Authenticated users can read resource comments" on public.resource_comments;
create policy "Authenticated users can read visible resource comments" on public.resource_comments
for select to authenticated using (not moderation_hidden or public.has_team_permission('moderation'));

create or replace function public.moderate_hide_content(p_target_type text,p_target_id uuid,p_hidden boolean default true)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_permission('moderation') then raise exception 'Moderation permission required'; end if;
  if p_target_type='resource' then update public.resources set moderation_hidden=p_hidden where id=p_target_id;
  elsif p_target_type='discussion' then update public.discussions set moderation_hidden=p_hidden where id=p_target_id;
  elsif p_target_type='reply' then update public.discussion_replies set moderation_hidden=p_hidden where id=p_target_id;
  elsif p_target_type='message' then update public.resource_comments set moderation_hidden=p_hidden where id=p_target_id;
  else raise exception 'Unsupported content type'; end if;
  insert into public.admin_activity_logs(actor_id,action,details)
  values(auth.uid(),case when p_hidden then 'moderation_content_hidden' else 'moderation_content_restored' end,jsonb_build_object('target_type',p_target_type,'target_id',p_target_id));
  return true;
end;
$$;
revoke all on function public.moderate_hide_content(text,uuid,boolean) from public;
grant execute on function public.moderate_hide_content(text,uuid,boolean) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031260000_complete_team_permission_notifications.sql
-- =========================================================
-- 团队通知必须列出成员实际获得的全部权限，包括私人群聊和群公告。
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
    v_event:='removed'; v_title:='Your team membership has changed';
    v_message:='Your North Synapse team membership has been removed. Your account remains a regular user account.';
    v_permissions:='[]'::jsonb;
    insert into public.team_notifications(user_id,event_type,previous_role,new_role,title,message,permissions)
    values(v_target_id,v_event,v_old_role,null,v_title,v_message,v_permissions);
    delete from public.team_members where user_id=v_target_id;
  else
    if v_old_role is null then v_event:='added';
    elsif v_old_role=p_role then raise exception 'This account already has that team role';
    elsif p_role='core_team' then v_event:='promoted';
    else v_event:='demoted'; end if;
    insert into public.team_members(user_id,role,added_by,updated_at)
    values(v_target_id,p_role,v_admin_id,now())
    on conflict(user_id) do update set role=excluded.role,added_by=excluded.added_by,updated_at=now();

    if p_role='core_team' then
      v_title:=case when v_event='added' then 'Welcome to the North Synapse Core Team' else 'Your team role has been updated' end;
      v_message:='You are now a Core Team member. You can view platform statistics, process reports, manage user accounts, handle user support, view administrative activity logs, and use the private Team Chat including group announcements.';
      v_permissions:='["View platform statistics","Review and process user reports","Manage user accounts","Handle user support requests","View administrative activity logs","Access the private Team Chat and send messages","Publish and manage pinned team announcements"]'::jsonb;
    else
      v_title:=case when v_event='added' then 'Welcome to the North Synapse Community Team' else 'Your team role has been updated' end;
      v_message:='You are now a Community Team member. You can view platform statistics, process reports, handle user support, and use the private Team Chat including group announcements.';
      v_permissions:='["View platform statistics","Review and process user reports","Handle user support requests","Access the private Team Chat and send messages","Publish team announcements"]'::jsonb;
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
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031270000_team_support_realtime.sql
-- =========================================================
-- 支持请求状态和团队回复通过 Realtime 同步到提交者。
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='support_tickets') then
    alter publication supabase_realtime add table public.support_tickets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='content_reports') then
    alter publication supabase_realtime add table public.content_reports;
  end if;
end $$;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031280000_expand_user_directory.sql
-- =========================================================
-- Core Team 的用户目录应包含所有注册账号；管理员和团队成员额外显示身份。
create or replace function public.team_user_directory(p_search text default '')
returns table(user_id uuid,email text,username text,nickname text,created_at timestamptz,team_role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_permission('users') then raise exception 'User management permission required'; end if;
  return query
    select u.id,u.email,
      coalesce(p.username,split_part(coalesce(u.email,''),'@',1)),
      coalesce(p.nickname,p.username,split_part(coalesce(u.email,''),'@',1)),
      u.created_at,
      case when a.user_id is not null then 'administrator' else tm.role end
    from auth.users u
    left join public.profiles p on p.id=u.id
    left join public.team_members tm on tm.user_id=u.id
    left join public.admin_users a on a.user_id=u.id
    where coalesce(u.email,'') ilike '%'||trim(coalesce(p_search,''))||'%'
       or coalesce(p.username,'') ilike '%'||trim(coalesce(p_search,''))||'%'
       or coalesce(p.nickname,'') ilike '%'||trim(coalesce(p_search,''))||'%'
    order by u.created_at desc
    limit 100;
end;
$$;
revoke all on function public.team_user_directory(text) from public;
grant execute on function public.team_user_directory(text) to authenticated;
notify pgrst, 'reload schema';

-- =========================================================
-- Included migration: supabase/migrations/20261031290000_team_chat_audit_actions.sql
-- =========================================================
-- 将团队聊天中的管理性操作也纳入审计日志。
create or replace function public.record_team_activity(
  p_action text,
  p_target_user_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action like 'report_%' then
    if not public.has_team_permission('moderation') then raise exception 'Moderation permission required'; end if;
  elsif p_action like 'support_%' then
    if not public.has_team_permission('support') then raise exception 'Support permission required'; end if;
  elsif p_action like 'chat_%' then
    if not public.has_team_permission('team_chat') then raise exception 'Team chat permission required'; end if;
  else
    raise exception 'Unsupported activity type';
  end if;
  insert into public.admin_activity_logs(actor_id,action,target_user_id,details)
  values(auth.uid(),p_action,p_target_user_id,coalesce(p_details,'{}'::jsonb));
end;
$$;
revoke all on function public.record_team_activity(text,uuid,jsonb) from public;
grant execute on function public.record_team_activity(text,uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';

commit;
