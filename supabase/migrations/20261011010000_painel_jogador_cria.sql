-- =====================================================================
-- Jogador também constrói o mundo: ele pode criar ficha (NPC, local,
-- item, facção, personagem) e registrar o resumo da sessão.
--
-- Diferença pro mestre: o que o jogador cria já nasce visível pra mesa e
-- não pode ser escondido por ele. Segredo é ferramenta de quem mestra; o
-- jogador registra o que a mesa viveu.
--
-- Cada linha guarda quem criou, então ele edita e apaga só o que é dele.
-- O mestre continua podendo mexer em tudo (as policies de mestre são
-- `for all`), inclusive ocultar depois, se precisar.
-- =====================================================================

alter table painel_entidades add column if not exists criado_por uuid references profiles(id) on delete set null;
alter table painel_sessoes   add column if not exists criado_por uuid references profiles(id) on delete set null;

create index if not exists painel_entidades_criado_por_idx on painel_entidades (criado_por);
create index if not exists painel_sessoes_criado_por_idx on painel_sessoes (criado_por);

-- ---------- Entidades do jogador ---------------------------------------
create policy painel_entidade_membro_cria on painel_entidades for insert with check (
  eh_membro_da_mesa(mesa_id) and criado_por = auth.uid() and not oculta
);

create policy painel_entidade_membro_edita on painel_entidades for update
  using (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid())
  -- `not oculta` no check: o jogador não pode transformar a ficha dele em segredo.
  with check (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid() and not oculta);

create policy painel_entidade_membro_apaga on painel_entidades for delete
  using (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid());

-- ---------- Campos da ficha do jogador ---------------------------------
-- Só na própria ficha, e sempre visível pra mesa: campo oculto dentro de
-- ficha de jogador seria um segredo que o mestre não controla.
create or replace function painel_entidade_do_membro(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from painel_entidades x where x.id = e and x.criado_por = auth.uid());
$$;

create policy painel_campo_membro_cria on painel_campos for insert with check (
  eh_membro_da_mesa(mesa_id) and vis = 'mesa' and painel_entidade_do_membro(entidade_id)
);

create policy painel_campo_membro_edita on painel_campos for update
  using (eh_membro_da_mesa(mesa_id) and painel_entidade_do_membro(entidade_id))
  with check (eh_membro_da_mesa(mesa_id) and vis = 'mesa' and painel_entidade_do_membro(entidade_id));

create policy painel_campo_membro_apaga on painel_campos for delete
  using (eh_membro_da_mesa(mesa_id) and painel_entidade_do_membro(entidade_id));

-- ---------- Resumo de sessão escrito pelo jogador -----------------------
-- Nasce publicado: não existe rascunho de jogador, o relato é da mesa.
create policy painel_sessao_membro_cria on painel_sessoes for insert with check (
  eh_membro_da_mesa(mesa_id) and criado_por = auth.uid() and publicado
);

create policy painel_sessao_membro_edita on painel_sessoes for update
  using (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid())
  with check (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid() and publicado);

create policy painel_sessao_membro_apaga on painel_sessoes for delete
  using (eh_membro_da_mesa(mesa_id) and criado_por = auth.uid());
