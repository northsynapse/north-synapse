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
