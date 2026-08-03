-- Run this in the Supabase SQL editor for your project.
-- Covers the required `tasks` table, bonus fields, a `team_members` table
-- for assignees, and Row Level Security so guests only see their own data.
-- Safe to run more than once.

-- ── Team members ─────────────────────────────────────────────
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#2E7D4F', -- hex color for the avatar chip
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;

drop policy if exists "Users can view their own team members" on team_members;
drop policy if exists "Users can insert their own team members" on team_members;
drop policy if exists "Users can delete their own team members" on team_members;

create policy "Users can view their own team members"
  on team_members for select
  using (auth.uid() = user_id);

create policy "Users can insert their own team members"
  on team_members for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own team members"
  on team_members for delete
  using (auth.uid() = user_id);

-- ── Tasks ─────────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('todo', 'in_progress', 'in_review', 'done')) default 'todo',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  description text,
  priority text not null check (priority in ('low', 'normal', 'high')) default 'normal',
  due_date date,
  assignee_id uuid references team_members(id) on delete set null
);

-- If the table already existed from an earlier run, add the new columns.
alter table tasks add column if not exists description text;
alter table tasks add column if not exists priority text not null default 'normal';
alter table tasks add column if not exists due_date date;
alter table tasks add column if not exists assignee_id uuid references team_members(id) on delete set null;

-- Add the priority check constraint separately so re-running doesn't error
-- if it already exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_priority_check'
  ) then
    alter table tasks add constraint tasks_priority_check
      check (priority in ('low', 'normal', 'high'));
  end if;
end $$;

alter table tasks enable row level security;

drop policy if exists "Users can view their own tasks" on tasks;
drop policy if exists "Users can insert their own tasks" on tasks;
drop policy if exists "Users can update their own tasks" on tasks;
drop policy if exists "Users can delete their own tasks" on tasks;

create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- ── Comments ──────────────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

drop policy if exists "Users can view their own comments" on comments;
drop policy if exists "Users can insert their own comments" on comments;
drop policy if exists "Users can delete their own comments" on comments;

create policy "Users can view their own comments"
  on comments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- ── Activity log ──────────────────────────────────────────────
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

drop policy if exists "Users can view their own activity" on activity_log;
drop policy if exists "Users can insert their own activity" on activity_log;

create policy "Users can view their own activity"
  on activity_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activity"
  on activity_log for insert
  with check (auth.uid() = user_id);
