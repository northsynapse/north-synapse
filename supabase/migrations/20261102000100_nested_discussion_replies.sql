-- 为讨论回复增加父级引用，支持在评论下继续回复。
ALTER TABLE public.discussion_replies
  ADD COLUMN IF NOT EXISTS parent_reply_id uuid
  REFERENCES public.discussion_replies(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS discussion_replies_parent_reply_id_idx
  ON public.discussion_replies(parent_reply_id);

-- 让同一讨论的回复按时间顺序读取时有稳定索引。
CREATE INDEX IF NOT EXISTS discussion_replies_discussion_created_at_idx
  ON public.discussion_replies(discussion_id, created_at);
