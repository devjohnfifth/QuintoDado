-- Bucket `event-banners` precisa ser criado à mão no Storage do Supabase
-- (público, 5MB, jpeg/png/webp) igual o `mesa-banners` foi — esta migration
-- só cuida das policies, mesmo padrão de 20260908140000_storage_mesa_banners.sql.
create policy event_banner_upload on storage.objects for insert
  with check (
    bucket_id = 'event-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy event_banner_atualiza on storage.objects for update
  using (
    bucket_id = 'event-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy event_banner_apaga on storage.objects for delete
  using (
    bucket_id = 'event-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy event_banner_leitura on storage.objects for select
  using (bucket_id = 'event-banners');
