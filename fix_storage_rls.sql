-- ==========================================
-- SCRIPT TO FIX "NEW ROW VIOLATES RLS" ON STORAGE
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create the 'produtos' bucket if it doesn't exist (Public)
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = true;

-- 2. Create Policies for the 'produtos' bucket
-- We first attempt to drop them to avoid "policy already exists" errors if you re-run.

begin;
  drop policy if exists "Public Access Get" on storage.objects;
  drop policy if exists "Public Access Insert" on storage.objects;
  drop policy if exists "Public Access Update" on storage.objects;
  drop policy if exists "Public Access Delete" on storage.objects;
end;

-- 3. Apply FULL PUBLIC access policies for the 'produtos' bucket
-- WARNING: This allows anyone to view/upload/delete images in this specific bucket.
-- Suitable for this application's current public file usage.

create policy "Public Access Get"
on storage.objects for select
using ( bucket_id = 'produtos' );

create policy "Public Access Insert"
on storage.objects for insert
with check ( bucket_id = 'produtos' );

create policy "Public Access Update"
on storage.objects for update
using ( bucket_id = 'produtos' );

create policy "Public Access Delete"
on storage.objects for delete
using ( bucket_id = 'produtos' );
