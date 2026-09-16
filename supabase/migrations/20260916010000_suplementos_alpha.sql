-- Suplementos (Alpha, só gratuitos). As tabelas já vieram na migration
-- inicial; aqui entram as policies que faltavam, os ajustes de FK que
-- quebrariam "excluir usuário", o contador de downloads e a RPC que salva as
-- tabelas aleatórias de uma vez só.

-- ---------------------------------------------------------------------
-- Tabelas aleatórias
-- ---------------------------------------------------------------------
alter table tabelas_aleatorias
  add constraint tabela_dado_valido check (dado in ('d20', 'd66', 'd100'));

-- Leitura segue a visibilidade do suplemento pai. `gratuito` entra de
-- propósito: pago (v1) vai precisar respeitar itens_livres, e até lá é mais
-- seguro não expor tabela de suplemento pago nenhuma.
create policy tabela_aleatoria_leitura on tabelas_aleatorias for select using (
  eh_admin() or exists (
    select 1 from suplementos s
    where s.id = suplemento_id
      and s.publicado and s.gratuito
      and s.classificacao = any (classificacoes_permitidas())
  )
);
create policy tabela_aleatoria_admin on tabelas_aleatorias for all
  using (eh_admin()) with check (eh_admin());

create policy tabela_item_leitura on tabela_itens for select using (
  eh_admin() or exists (
    select 1 from tabelas_aleatorias t
    join suplementos s on s.id = t.suplemento_id
    where t.id = tabela_id
      and s.publicado and s.gratuito
      and s.classificacao = any (classificacoes_permitidas())
  )
);
create policy tabela_item_admin on tabela_itens for all
  using (eh_admin()) with check (eh_admin());

-- ---------------------------------------------------------------------
-- Arquivos: remoção lógica + escrita do admin
-- ---------------------------------------------------------------------
-- `downloads.arquivo_id` não tem cascade (e não deve ter: é histórico), então
-- arquivo que já foi baixado não pode ser apagado. Remover vira marcar.
alter table arquivos_suplemento add column if not exists removido_em timestamptz;

drop policy if exists arquivo_leitura on arquivos_suplemento;
create policy arquivo_leitura on arquivos_suplemento for select using (
  eh_admin() or (
    removido_em is null and exists (
      select 1 from suplementos s where s.id = suplemento_id
        and s.publicado and s.classificacao = any (classificacoes_permitidas())
        and (eh_preview or s.gratuito or exists (
          select 1 from compras c
          where c.usuario_id = auth.uid() and c.suplemento_id = s.id and c.reembolsado_em is null
        ))
    )
  )
);
create policy arquivo_admin on arquivos_suplemento for all
  using (eh_admin()) with check (eh_admin());

-- ---------------------------------------------------------------------
-- Downloads
-- ---------------------------------------------------------------------
-- Sem isso, excluir pelo admin um usuário que já baixou algo falha no FK.
alter table downloads drop constraint if exists downloads_usuario_id_fkey;
alter table downloads add constraint downloads_usuario_id_fkey
  foreign key (usuario_id) references profiles(id) on delete set null;

-- O `exists` roda com o RLS de arquivos_suplemento de quem está inserindo, então
-- publicação, idade e remoção valem aqui sem repetir a regra.
create policy download_proprio_cria on downloads for insert with check (
  usuario_id = auth.uid()
  and exists (select 1 from arquivos_suplemento a where a.id = arquivo_id)
);
create policy download_proprio_leitura on downloads for select
  using (usuario_id = auth.uid() or eh_admin());

-- Quem baixa não tem permissão de escrever em `suplementos`, por isso o
-- contador sobe por trigger security definer.
create or replace function incrementa_downloads_suplemento() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update suplementos s
  set downloads_count = s.downloads_count + 1
  from arquivos_suplemento a
  where a.id = new.arquivo_id and s.id = a.suplemento_id;
  return new;
end;
$$;

create trigger downloads_incrementa_contador
  after insert on downloads
  for each row execute function incrementa_downloads_suplemento();

-- Mesmo problema de FK do downloads — e o PDF da tabela vai registrar aqui.
alter table eventos_analytics drop constraint if exists eventos_analytics_usuario_id_fkey;
alter table eventos_analytics add constraint eventos_analytics_usuario_id_fkey
  foreign key (usuario_id) references profiles(id) on delete set null;

-- ---------------------------------------------------------------------
-- Favoritos
-- ---------------------------------------------------------------------
-- A policy antiga (for all, só dono) deixava favoritar suplemento que a
-- pessoa nem pode ver. O `exists` herda o RLS de suplementos.
drop policy if exists favorito_proprio on favoritos;
create policy favorito_proprio_leitura on favoritos for select
  using (usuario_id = auth.uid());
create policy favorito_proprio_cria on favoritos for insert with check (
  usuario_id = auth.uid()
  and exists (select 1 from suplementos s where s.id = suplemento_id)
);
create policy favorito_proprio_apaga on favoritos for delete
  using (usuario_id = auth.uid());

-- ---------------------------------------------------------------------
-- Índices (Postgres não indexa FK sozinho)
-- ---------------------------------------------------------------------
create index if not exists arquivos_suplemento_suplemento_idx on arquivos_suplemento (suplemento_id);
create index if not exists tabelas_aleatorias_suplemento_idx on tabelas_aleatorias (suplemento_id);
create index if not exists tabela_itens_tabela_idx on tabela_itens (tabela_id);
create index if not exists downloads_usuario_idx on downloads (usuario_id, criado_em desc);

-- ---------------------------------------------------------------------
-- RPC: salva todas as tabelas de um suplemento numa transação só
-- ---------------------------------------------------------------------
-- Uma tabela de d100 são 100 linhas; gravar isso em escritas soltas pelo
-- supabase-js deixaria o suplemento pela metade se uma falhasse no meio.
-- Os ids mudam a cada save, então o cliente manda uma `chave` própria por
-- tabela e a tabela aninhada é apontada por essa chave.
--
-- Formato de p_tabelas:
-- [{ chave, titulo, dado, colunas: [text], ordem,
--    itens: [{ faixa_min, faixa_max, valores: [text], tabela_aninhada_chave }] }]
--
-- security invoker: as escritas passam pelo RLS de quem chama (admin).
create or replace function salvar_tabelas_suplemento(p_suplemento_id uuid, p_tabelas jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tabela jsonb;
  v_item jsonb;
  v_id uuid;
  v_mapa jsonb := '{}'::jsonb;
  v_chave_aninhada text;
  v_id_aninhada uuid;
begin
  if not eh_admin() then
    raise exception 'Só admin pode salvar tabelas de suplemento.' using errcode = '42501';
  end if;

  if not exists (select 1 from suplementos where id = p_suplemento_id) then
    raise exception 'Suplemento não encontrado.';
  end if;

  -- Itens primeiro: tabela_aninhada_id não tem cascade.
  delete from tabela_itens
  where tabela_id in (select id from tabelas_aleatorias where suplemento_id = p_suplemento_id);
  delete from tabelas_aleatorias where suplemento_id = p_suplemento_id;

  for v_tabela in select * from jsonb_array_elements(coalesce(p_tabelas, '[]'::jsonb)) loop
    if v_mapa ? (v_tabela->>'chave') then
      raise exception 'Chave de tabela repetida: %', v_tabela->>'chave';
    end if;

    insert into tabelas_aleatorias (suplemento_id, titulo, dado, colunas, ordem)
    values (
      p_suplemento_id,
      v_tabela->>'titulo',
      v_tabela->>'dado',
      array(select jsonb_array_elements_text(v_tabela->'colunas')),
      coalesce((v_tabela->>'ordem')::int, 0)
    )
    returning id into v_id;

    v_mapa := v_mapa || jsonb_build_object(v_tabela->>'chave', v_id);
  end loop;

  for v_tabela in select * from jsonb_array_elements(coalesce(p_tabelas, '[]'::jsonb)) loop
    for v_item in select * from jsonb_array_elements(coalesce(v_tabela->'itens', '[]'::jsonb)) loop
      v_chave_aninhada := nullif(v_item->>'tabela_aninhada_chave', '');
      v_id_aninhada := null;

      if v_chave_aninhada is not null then
        if not (v_mapa ? v_chave_aninhada) then
          raise exception 'Tabela aninhada inexistente: %', v_chave_aninhada;
        end if;
        v_id_aninhada := (v_mapa->>v_chave_aninhada)::uuid;
      end if;

      insert into tabela_itens (tabela_id, faixa_min, faixa_max, valores, tabela_aninhada_id)
      values (
        (v_mapa->>(v_tabela->>'chave'))::uuid,
        (v_item->>'faixa_min')::int,
        (v_item->>'faixa_max')::int,
        array(select jsonb_array_elements_text(v_item->'valores')),
        v_id_aninhada
      );
    end loop;
  end loop;
end;
$$;

revoke all on function salvar_tabelas_suplemento(uuid, jsonb) from public, anon;
grant execute on function salvar_tabelas_suplemento(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Storage: capas e imagens da descrição
-- ---------------------------------------------------------------------
-- Bucket `suplemento-capas` criado via Storage API (público, 5MB,
-- jpeg/png/webp) — policy não cria bucket. Só admin sobe, porque só admin
-- escreve suplemento.
create policy suplemento_capa_upload on storage.objects for insert
  with check (
    bucket_id = 'suplemento-capas'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.eh_admin()
  );

create policy suplemento_capa_atualiza on storage.objects for update
  using (
    bucket_id = 'suplemento-capas'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.eh_admin()
  );

create policy suplemento_capa_apaga on storage.objects for delete
  using (
    bucket_id = 'suplemento-capas'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.eh_admin()
  );

create policy suplemento_capa_leitura on storage.objects for select
  using (bucket_id = 'suplemento-capas');
