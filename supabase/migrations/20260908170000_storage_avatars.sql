-- Bucket `avatars` já criado via Storage API (público, 3MB, jpeg/png/webp).
-- Mesmo padrão do mesa-banners: caminho `{auth.uid()}/{arquivo}`.
create policy avatar_upload on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatar_atualiza on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatar_apaga on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatar_leitura on storage.objects for select
  using (bucket_id = 'avatars');
