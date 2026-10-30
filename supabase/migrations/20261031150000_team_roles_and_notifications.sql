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
