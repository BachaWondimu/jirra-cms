-- JIRRA CMS: run this once in Supabase SQL Editor.
-- Then create your Auth user in Authentication > Users and add that user's UUID
-- using the INSERT statement at the bottom of this file.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Blog','Poster','Event','Culture','Football','Community')),
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  event_date date,
  event_location text,
  media_url text,
  media_type text check (media_type is null or media_type in ('image','video')),
  media_path text,
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.admin_users enable row level security;
alter table public.posts enable row level security;

-- Central admin check. SECURITY DEFINER prevents policy recursion and exposes no secrets.
create or replace function public.is_jirra_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_jirra_admin() from public;
grant execute on function public.is_jirra_admin() to anon, authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
create policy "admins can verify themselves" on public.admin_users
for select to authenticated using (user_id = auth.uid());

revoke all on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;

create policy "public can read published posts" on public.posts
for select to anon using (status = 'published');
create policy "authenticated can read published or admin can read all" on public.posts
for select to authenticated using (status = 'published' or public.is_jirra_admin());
create policy "admins can insert posts" on public.posts
for insert to authenticated with check (public.is_jirra_admin() and author_id = auth.uid());
create policy "admins can update posts" on public.posts
for update to authenticated using (public.is_jirra_admin()) with check (public.is_jirra_admin());
create policy "admins can delete posts" on public.posts
for delete to authenticated using (public.is_jirra_admin());

-- Create the public media bucket. Public means anyone can VIEW a known media URL;
-- upload/update/delete still require the policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media',true,104857600,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=true, file_size_limit=104857600,
allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'];

create policy "admins upload media" on storage.objects
for insert to authenticated with check (bucket_id='media' and public.is_jirra_admin());
create policy "admins can read media metadata" on storage.objects
for select to authenticated using (bucket_id='media' and public.is_jirra_admin());
create policy "admins update media" on storage.objects
for update to authenticated using (bucket_id='media' and public.is_jirra_admin()) with check (bucket_id='media' and public.is_jirra_admin());
create policy "admins delete media" on storage.objects
for delete to authenticated using (bucket_id='media' and public.is_jirra_admin());

-- AFTER creating your login user in Authentication > Users, copy its UUID and run:
-- insert into public.admin_users(user_id) values ('PASTE-YOUR-AUTH-USER-UUID-HERE');
