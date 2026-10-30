-- 支持请求状态和团队回复通过 Realtime 同步到提交者。
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='support_tickets') then
    alter publication supabase_realtime add table public.support_tickets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='content_reports') then
    alter publication supabase_realtime add table public.content_reports;
  end if;
end $$;
notify pgrst, 'reload schema';
