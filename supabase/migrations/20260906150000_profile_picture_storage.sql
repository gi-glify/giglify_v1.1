-- Store profile pictures in Supabase Storage and keep only their public URL
-- in profiles.profile_picture.
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update set public = true;

drop policy if exists "profile pictures: public read" on storage.objects;
create policy "profile pictures: public read" on storage.objects
  for select using (bucket_id = 'profile-pictures');

drop policy if exists "profile pictures: insert own" on storage.objects;
create policy "profile pictures: insert own" on storage.objects
  for insert with check (bucket_id = 'profile-pictures' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile pictures: update own" on storage.objects;
create policy "profile pictures: update own" on storage.objects
  for update using (bucket_id = 'profile-pictures' and (storage.foldername(name))[1] = auth.uid()::text);
