-- 将笔记附件的 Storage 限制提高到 50 MB，避免常见图片和学习文件因 2 MB 限制无法上传。
-- 头像继续限制为 5 MB，避免个人资料图片占用过多存储空间。
update storage.buckets
set file_size_limit = 52428800
where id = 'resource-attachments';

update storage.buckets
set file_size_limit = 5242880
where id = 'profile-avatars';
