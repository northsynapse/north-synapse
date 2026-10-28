-- Ensure the application-facing comment field exists in the database schema.
alter table public.resource_comments
  add column if not exists content text not null default '';

-- Refresh PostgREST's schema cache so the new column is immediately available.
notify pgrst, 'reload schema';
