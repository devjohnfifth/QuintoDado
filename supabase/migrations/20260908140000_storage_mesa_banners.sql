-- Bucket `mesa-banners` já criado via Storage API (público, 5MB, jpeg/png/webp).
-- Caminho de upload é `{auth.uid()}/{arquivo}` — não depende de já existir um
-- mesa_id (a mesa só ganha id depois de criada), então a policy só confere
-- se a pasta bate com o dono da sessão. A tela de criação de mesa é só pra
-- mestre/admin, então isso já limita quem realmente usa o upload; o objeto
-- em si não é sensível (é só a capa da mesa).
create policy mesa_banner_upload on storage.objects for insert
  with check (
    bucket_id = 'mesa-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy mesa_banner_atualiza on storage.objects for update
  using (
    bucket_id = 'mesa-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy mesa_banner_apaga on storage.objects for delete
  using (
    bucket_id = 'mesa-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura pública explícita (o bucket já é público, isso é só reforço —
-- mesma prática de "RLS ligado, negar por padrão, liberar o que precisa"
-- usada no resto do schema).
create policy mesa_banner_leitura on storage.objects for select
  using (bucket_id = 'mesa-banners');
