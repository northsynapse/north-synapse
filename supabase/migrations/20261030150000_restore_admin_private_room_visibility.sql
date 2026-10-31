-- 修复管理员对私密自习室的只读审核访问权限。
-- 普通用户仍只能查看公开房间或自己已加入的私密房间。

create or replace function public.can_view_study_room_members(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select (select public.is_current_user_admin()) or exists (
    select 1 from public.study_rooms r
    where r.id = p_room_id
      and (
        not r.is_private
        or exists (
          select 1 from public.study_room_active_members am
          where am.room_id = r.id and am.user_id = (select auth.uid())
        )
      )
  );
$$;

revoke all on function public.can_view_study_room_members(uuid) from public, anon;
grant execute on function public.can_view_study_room_members(uuid) to authenticated;

drop policy if exists "Study rooms visible only when public or joined" on public.study_rooms;
create policy "Study rooms visible only when public or joined"
on public.study_rooms for select to authenticated
using (
  status = 'active'
  and (
    (select public.is_current_user_admin())
    or not is_private
    or created_by = (select auth.uid())
    or owner_id = (select auth.uid())
    or exists (
      select 1 from public.study_room_active_members am
      where am.room_id = study_rooms.id and am.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Study room messages readable by room members" on public.study_room_messages;
create policy "Study room messages readable by room members"
on public.study_room_messages for select to authenticated
using (
  (select public.is_current_user_admin())
  or exists (
    select 1 from public.study_room_active_members am
    where am.room_id = study_room_messages.room_id and am.user_id = (select auth.uid())
  )
);

drop policy if exists "Presence visible in public rooms or to private room members" on public.study_room_presence;
create policy "Presence visible in public rooms or to private room members"
on public.study_room_presence for select to authenticated
using (
  (select public.is_current_user_admin())
  or exists (
    select 1 from public.study_rooms r
    where r.id = study_room_presence.room_id
      and (
        not r.is_private
        or exists (
          select 1 from public.study_room_active_members am
          where am.room_id = r.id and am.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "Authenticated users can read visible room membership" on public.study_room_active_members;
create policy "Authenticated users can read visible room membership"
on public.study_room_active_members for select to authenticated
using (
  user_id = (select auth.uid())
  or public.can_view_study_room_members(room_id)
);

notify pgrst, 'reload schema';
