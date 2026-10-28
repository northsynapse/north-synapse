-- 允许登录用户读取自己的在线状态行，确保 upsert 冲突检查可以正常工作。
drop policy if exists "Users can read own presence" on public.user_presence;
create policy "Users can read own presence" on public.user_presence
for select to authenticated using (user_id = (select auth.uid()));
