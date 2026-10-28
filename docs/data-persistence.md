# North Synapse data persistence rules

## Source of truth
- Supabase Postgres is the source of truth for structured, searchable application data.
- Supabase Storage holds uploaded binary files. Database rows store file metadata and the Storage object path.
- Browser state is for transient UI state and unsaved drafts only; it must not be the only copy of published or account-related data.
- Supabase Auth is the source of truth for authentication and session identity.

## Current mapping
- Profiles, grade/subject preferences, biography, avatar reference, and study-time totals: `public.profiles`.
- Published notes and their selected tags: `public.resources`.
- Uploaded note files: `public.resource_attachments` metadata + `resource-attachments` Storage bucket object.
- Avatar images: `profile-avatars` Storage bucket; the profile row references the uploaded public URL.
- Discussions and replies: `public.discussions`, `public.discussion_replies`.
- Comments: `public.resource_comments`.
- Likes and bookmarks: their respective Postgres tables.
- Feedback and ratings: `public.site_feedback` and the site's ratings table.
- Study-time totals: `public.profiles.total_study_seconds`, updated through the `add_study_time` database function.

## Rules for every future feature
1. Persist a user's submitted or confirmed data to Postgres before showing success.
2. Store binary files in Supabase Storage; save the bucket and object path plus searchable metadata in Postgres.
3. Do not use `localStorage`, React state, object URLs, or data URLs as the only persistent copy.
4. Load published content from Supabase on page load and after authentication changes.
5. Show an actionable error when a write fails; do not silently report success.
6. Define and review Row Level Security (RLS) policies for every new table and Storage bucket.
7. For multi-step uploads, handle partial failure and clean up orphaned database rows or Storage objects.
8. Add a versioned SQL migration for schema, indexes, constraints, policies, and Storage setup.
9. Do not store passwords or secrets in profile tables, browser storage, or public file buckets.
10. Keep a backup/export strategy for production data. Persistence alone is not a backup.

## Important limits
These rules improve durability, but they cannot guarantee that data is never lost. Account deletion, project deletion, provider outages, permission mistakes, and accidental destructive SQL can still remove data. Configure and periodically test database backups before treating the platform as production-ready.
