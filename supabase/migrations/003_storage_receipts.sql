-- Create receipts storage bucket (private)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Users can upload files under their own folder (receipts/{user_id}/...)
create policy "Users can upload their own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read files under their own folder
create policy "Users can view their own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can overwrite (upsert) their own files
create policy "Users can update their own receipts"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
create policy "Users can delete their own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
