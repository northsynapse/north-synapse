-- 笔记标签以文本数组保存，避免仅存在浏览器状态中。
alter table public.resources
  add column if not exists tags text[] not null default '{}'::text[];
