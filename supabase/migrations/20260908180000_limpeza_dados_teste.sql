-- Corrige um bug real de schema encontrado durante a limpeza dos dados de
-- teste: inscricao_respostas.pergunta_id não tinha ON DELETE CASCADE até
-- mesa_perguntas, então nunca dava pra apagar uma mesa que tivesse alguma
-- candidatura com resposta salva.
alter table inscricao_respostas
  drop constraint if exists inscricao_respostas_pergunta_id_fkey;
alter table inscricao_respostas
  add constraint inscricao_respostas_pergunta_id_fkey
  foreign key (pergunta_id) references mesa_perguntas(id) on delete cascade;

-- Limpeza dos dados de teste da sessão de desenvolvimento — mesas antigas
-- de teste (a exclusão em cascata cuida de mesa_perguntas, inscricoes,
-- inscricao_respostas e notificacoes que citam essas mesas no url).
delete from notificacoes
  where url like '/admin/mesas/5a09bacf-02e0-4334-941c-8717634506f1%'
     or url like '/admin/mesas/28c9974f-0e87-4410-843f-f3c0db9de69c%'
     or url like '/admin/mesas/eaa2cada-23c6-44a7-b9c0-f2c6b67ecfe0%'
     or url like '/admin/mesas/c5671a0b-afdb-4a58-aad3-cdeb1e23bd4a%';

delete from mesas where id in (
  '5a09bacf-02e0-4334-941c-8717634506f1', -- Mesa Teste +18
  '28c9974f-0e87-4410-843f-f3c0db9de69c', -- Mesa Teste 2 - Fluxo Completo
  'eaa2cada-23c6-44a7-b9c0-f2c6b67ecfe0', -- Investigação no Porão Esquecido
  'c5671a0b-afdb-4a58-aad3-cdeb1e23bd4a'  -- Teste
);

-- A conta jogador-teste@quintodado.test não saiu por causa da mesma trava
-- de FK — depois que rodar isto, ela sai limpo pelo painel: Authentication
-- → Users → jogador-teste@quintodado.test → Delete user.
