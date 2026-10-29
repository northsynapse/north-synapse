-- 自习室生命周期集成冒烟测试；任一断言失败都会使 CI 失败。
\set ON_ERROR_STOP on

insert into auth.users(id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003');

insert into public.profiles(id, username, nickname) values
  ('10000000-0000-4000-8000-000000000001', 'student1', 'Student One'),
  ('10000000-0000-4000-8000-000000000002', 'student2', 'Student Two'),
  ('10000000-0000-4000-8000-000000000003', 'student3', 'Student Three');

insert into public.study_rooms
  (id, name, subject, description, is_private, room_code, created_by, owner_id)
values
  ('test-public', 'Test Public', 'General Study', '', false, null,
   '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('test-private', 'Test Private', 'Mathematics', '', true, 'ROOMCODE12345',
   '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('test-kick', 'Test Kick', 'General Study', '', false, null,
   '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select public.join_study_room_v2('test-public', null);

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
select public.join_study_room_v2('test-public', null);

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select public.join_study_room_v2('test-private', 'ROOMCODE12345');

do $$
begin
  if (select count(*) from public.study_room_active_members where user_id = '10000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'A user must have only one active room';
  end if;
  if (select owner_id from public.study_rooms where id = 'test-public') is distinct from '10000000-0000-4000-8000-000000000002'::uuid then
    raise exception 'Leaving an owned room must transfer ownership to the earliest remaining member';
  end if;
end;
$$;

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';
select public.join_private_study_room_v2('ROOMCODE12345');

-- 验证私密房间信息、成员和聊天不会泄露给非成员。
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
insert into public.study_room_messages(room_id, user_id, display_name, avatar_url, body)
values ('test-private', '10000000-0000-4000-8000-000000000001', 'Student One', '', 'Private room test message');

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
do $$
begin
  if exists (select 1 from public.study_rooms where id = 'test-private') then
    raise exception 'Private room metadata must be hidden from non-members';
  end if;
  if exists (select 1 from public.study_room_active_members where room_id = 'test-private') then
    raise exception 'Private room membership must be hidden from non-members';
  end if;
  if exists (select 1 from public.study_room_messages where room_id = 'test-private') then
    raise exception 'Private room chat must be hidden from non-members';
  end if;
end;
$$;

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
do $$
begin
  if (select count(*) from public.study_room_messages where room_id = 'test-private') <> 1 then
    raise exception 'Active members must be able to read private room chat';
  end if;
end;
$$;
reset role;

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select public.end_study_room_v2('test-private');

do $$
begin
  if (select status from public.study_rooms where id = 'test-private') <> 'ended' then
    raise exception 'The owner must be able to end a room';
  end if;
  if exists (select 1 from public.study_room_active_members where room_id = 'test-private') then
    raise exception 'Ending a room must remove all active members';
  end if;
end;
$$;

select public.join_study_room_v2('test-kick', null);
set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
select public.join_study_room_v2('test-kick', null);

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select public.kick_study_room_member_v2('test-kick', '10000000-0000-4000-8000-000000000002');

do $smoke$
begin
  if exists (select 1 from public.study_room_active_members where room_id = 'test-kick' and user_id = '10000000-0000-4000-8000-000000000002') then
    raise exception 'Kicked users must be removed from active membership';
  end if;
  if not exists (select 1 from public.study_room_kick_events where room_id = 'test-kick' and user_id = '10000000-0000-4000-8000-000000000002') then
    raise exception 'Kicking a user must create a notification event';
  end if;
end;
$smoke$;

-- 踢出通知只能由被踢出的账号读取。
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
do $smoke$
begin
  if exists (select 1 from public.study_room_kick_events where room_id = 'test-kick') then
    raise exception 'Other users must not read kick notifications';
  end if;
end;
$smoke$;
set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
do $smoke$
begin
  if not exists (select 1 from public.study_room_kick_events where room_id = 'test-kick') then
    raise exception 'The kicked user must be able to read their own notification';
  end if;
end;
$smoke$;
reset role;

set request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select public.leave_study_room_v2('test-kick', null);
update public.study_rooms set empty_since = now() - interval '25 hours' where id = 'test-kick';
select public.cleanup_study_rooms();

do $$
begin
  if (select status from public.study_rooms where id = 'test-kick') <> 'ended' then
    raise exception 'An empty room older than 24 hours must expire';
  end if;
  if (select status from public.study_rooms where id = '00000000-0000-4000-8000-000000000001') <> 'active' then
    raise exception 'The permanent public lobby must never expire';
  end if;
end;
$$;
