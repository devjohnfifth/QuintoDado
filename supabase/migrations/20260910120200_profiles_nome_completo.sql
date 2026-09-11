-- Nome completo é opcional na criação de perfil — só vira necessário na
-- prática na hora de comprar ingresso de evento (o formulário de compra
-- pede se ainda estiver vazio). Nunca é selecionado em query pública —
-- mesmo tratamento que profiles.data_nascimento já recebe hoje.
alter table profiles add column if not exists nome_completo text;
