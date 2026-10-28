-- 账号注销：保留公开发布的笔记和讨论，但将作者匿名化；删除账号及其个人资料、评论、回复、收藏、点赞等关联数据。

-- 公开内容不能随 profiles 一起删除，因此允许作者为空。
alter table public.resources alter column author_id drop not null;
alter table public.resources drop constraint if exists resources_author_id_fkey;
alter table public.resources
  add constraint resources_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.discussions alter column author_id drop not null;
alter table public.discussions drop constraint if exists discussions_author_id_fkey;
alter table public.discussions
  add constraint discussions_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

-- 只能注销当前会话对应的账号。Auth 用户删除会级联删除 profile 及其他以用户为主体的数据。
create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- 先匿名化本人发布的公开内容，避免 profile 删除时连同帖子一起删除。
  update public.resources set author_id = null where author_id = current_user_id;
  update public.discussions set author_id = null where author_id = current_user_id;

  delete from auth.users where id = current_user_id;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.delete_current_account() from public;
grant execute on function public.delete_current_account() to authenticated;
