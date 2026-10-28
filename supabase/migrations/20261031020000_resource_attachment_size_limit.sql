-- 将资源附件 bucket 的单文件限制提高到 20 MiB。
-- 如果 Supabase 项目级 Storage 限制低于此值，还需要在 Dashboard 中同步调整。
update storage.buckets
set file_size_limit = 20971520
where id = 'resource-attachments';
