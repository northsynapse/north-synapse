-- Allow verified administrators to remove community content during moderation.
-- The client-side admin checks are only a UI convenience; RLS enforces permission in the database.

drop policy if exists "Admins can delete resources" on public.resources;
create policy "Admins can delete resources"
on public.resources
for delete
to authenticated
using (public.is_current_user_admin());

drop policy if exists "Admins can delete resource comments" on public.resource_comments;
create policy "Admins can delete resource comments"
on public.resource_comments
for delete
to authenticated
using (public.is_current_user_admin());

drop policy if exists "Admins can delete discussions" on public.discussions;
create policy "Admins can delete discussions"
on public.discussions
for delete
to authenticated
using (public.is_current_user_admin());

drop policy if exists "Admins can delete discussion replies" on public.discussion_replies;
create policy "Admins can delete discussion replies"
on public.discussion_replies
for delete
to authenticated
using (public.is_current_user_admin());
