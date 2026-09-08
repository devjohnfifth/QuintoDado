-- A RLS de `inscricoes` só libera leitura pro próprio candidato, o mestre da
-- mesa ou admin (correto — respostas de ficha e identidade do candidato são
-- dado sensível). Isso quebrava a contagem pública de "vagas preenchidas" em
-- /mesas e /mesas/[slug]: pra um visitante anônimo, o embed `inscricoes(count)`
-- do PostgREST sempre retornava 0, mesmo com candidaturas aprovadas de verdade.
--
-- Esta função expõe só a contagem (nunca as linhas), como "computed column"
-- do PostgREST — bypassa RLS via security definer, mas devolve um número, não
-- os dados de quem se candidatou.
create or replace function vagas_preenchidas(m mesas)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from inscricoes where mesa_id = m.id and status = 'aprovado';
$$;

grant execute on function vagas_preenchidas(mesas) to anon, authenticated, service_role;

-- Gap real encontrado em auditoria (2026-09-08): a policy de SELECT em `mesas`
-- já bloqueia um usuário de ver mesa acima da própria faixa etária (via
-- classificacoes_permitidas()), mas a policy de INSERT em `inscricoes`
-- (inscricao_cria) só checava `usuario_id = auth.uid()` — quem já soubesse o
-- id de uma mesa +18 (fora da UI, já que a UI nem mostra) conseguia inserir
-- uma candidatura direto pela API do Supabase, sem passar pela Server Action.
-- Fechado aqui reaproveitando a mesma função de classificação já usada em
-- `mesa_leitura`, então as duas regras nunca ficam fora de sincronia.
drop policy if exists inscricao_cria on inscricoes;
create policy inscricao_cria on inscricoes for insert
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from mesas m
      where m.id = mesa_id and m.classificacao = any (classificacoes_permitidas())
    )
  );
