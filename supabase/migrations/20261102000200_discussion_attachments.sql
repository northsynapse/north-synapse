-- 为讨论主题增加附件元数据，文件本体保存在现有 resource-attachments Storage bucket。
ALTER TABLE public.discussions
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 限制附件元数据必须为数组，避免写入意外的数据结构。
ALTER TABLE public.discussions
  ADD CONSTRAINT discussions_attachments_is_array
  CHECK (jsonb_typeof(attachments) = 'array');
