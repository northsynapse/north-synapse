-- Persist each user's private goal for each study room.
create table if not exists public.study_room_goals (
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null default '' check (char_length(goal) <= 500),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.study_room_goals enable row level security;

drop policy if exists "Users can read their own study room goals" on public.study_room_goals;
create policy "Users can read their own study room goals"
  on public.study_room_goals for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can insert their own study room goals" on public.study_room_goals;
create policy "Users can insert their own study room goals"
  on public.study_room_goals for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own study room goals" on public.study_room_goals;
create policy "Users can update their own study room goals"
  on public.study_room_goals for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.study_room_goals to authenticated;
