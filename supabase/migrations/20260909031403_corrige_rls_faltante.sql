-- =====================================================================
-- CORREÇÃO CRÍTICA: 11 tabelas nasceram na migração inicial sem RLS.
-- Chave anon (pública, exposta no navegador) tinha SELECT/INSERT/UPDATE/
-- DELETE livre nelas — confirmado em produção via teste com a chave anon.
-- Regra invíolável nº2 do CLAUDE.md: "RLS ligado em toda tabela. Negar
-- por padrão." Esta migração fecha a lacuna, sem mudar nenhuma coluna.
-- =====================================================================

alter table sistemas         enable row level security;
alter table tags             enable row level security;
alter table links            enable row level security;
alter table depoimentos      enable row level security;
alter table kit_suplementos  enable row level security;
alter table mesa_tags        enable row level security;
alter table suplemento_tags  enable row level security;
alter table mesa_sessoes     enable row level security;
alter table webhook_eventos  enable row level security;
alter table faixas_comissao  enable row level security;
alter table eventos_analytics enable row level security;

-- Sistemas: lista de referência usada nos formulários de criação de mesa
-- e nos favoritos — leitura pública dos ativos, escrita só do admin.
create policy sistema_leitura on sistemas for select
  using (ativo or eh_admin());
create policy sistema_admin on sistemas for all
  using (eh_admin()) with check (eh_admin());

-- Tags: taxonomia institucional, ainda não usada no app — leitura
-- pública, escrita só do admin.
create policy tag_leitura on tags for select using (true);
create policy tag_admin on tags for all
  using (eh_admin()) with check (eh_admin());

-- Links: vitrine institucional (ver /links) — só os ativos são públicos.
create policy link_leitura on links for select
  using (ativo or eh_admin());
create policy link_admin on links for all
  using (eh_admin()) with check (eh_admin());

-- Depoimentos: só os publicados são públicos.
create policy depoimento_leitura on depoimentos for select
  using (publicado or eh_admin());
create policy depoimento_admin on depoimentos for all
  using (eh_admin()) with check (eh_admin());

-- Junções tag<->suplemento e tag<->mesa: leitura acompanha a
-- visibilidade da entidade dona; escrita só do admin (ou mestre da
-- mesa, no caso de mesa_tags).
create policy suplemento_tag_leitura on suplemento_tags for select using (
  eh_admin() or exists (
    select 1 from suplementos s where s.id = suplemento_id
      and s.publicado and s.classificacao = any (classificacoes_permitidas())
  )
);
create policy suplemento_tag_admin on suplemento_tags for all
  using (eh_admin()) with check (eh_admin());

create policy mesa_tag_leitura on mesa_tags for select using (
  eh_admin() or exists (
    select 1 from mesas m where m.id = mesa_id
      and (m.mestre_id = auth.uid()
           or (m.status in ('publicada','confirmada','em_andamento')
               and m.classificacao = any (classificacoes_permitidas())))
  )
);
create policy mesa_tag_gerencia on mesa_tags for all using (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
) with check (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
);

-- Kit de suplementos: leitura acompanha o kit; escrita só admin
-- (kits são só do admin, ver política suplemento_admin/kits existente).
create policy kit_suplemento_leitura on kit_suplementos for select using (true);
create policy kit_suplemento_admin on kit_suplementos for all
  using (eh_admin()) with check (eh_admin());

-- Sessões de uma mesa: mesma visibilidade da mesa; escrita do
-- mestre dono ou admin (mesmo padrão de mesa_perguntas).
create policy mesa_sessao_leitura on mesa_sessoes for select using (
  exists (
    select 1 from mesas m where m.id = mesa_id
      and (eh_admin() or m.mestre_id = auth.uid()
           or (m.status in ('publicada','confirmada','em_andamento')
               and m.classificacao = any (classificacoes_permitidas())))
  )
);
create policy mesa_sessao_gerencia on mesa_sessoes for all using (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
) with check (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
);

-- Financeiro/infra interna — nenhum acesso público, só admin (escrita
-- real de webhook segue vindo do service_role no servidor, que ignora
-- RLS; a policy de admin aqui é só pra dar visibilidade no painel).
create policy faixa_comissao_leitura on faixas_comissao for select using (eh_admin());
create policy webhook_evento_leitura on webhook_eventos for select using (eh_admin());

-- Analytics: sem acesso público ainda — nenhuma feature do app lê ou
-- escreve nessa tabela hoje. Quando a coleta for implementada, criar
-- policy de insert específica pro evento anônimo/autenticado ali.
create policy evento_analytics_admin on eventos_analytics for select using (eh_admin());
