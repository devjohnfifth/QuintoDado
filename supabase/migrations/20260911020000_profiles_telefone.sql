-- Telefone é opcional na criação de perfil — só vira necessário na prática
-- na hora de comprar ingresso de evento (o formulário de compra pede se
-- ainda estiver vazio), pra dar um jeito de contato caso a pessoa esqueça
-- de mandar o comprovante pelo WhatsApp. Nunca é selecionado em query
-- pública — mesmo tratamento que profiles.nome_completo já recebe.
alter table profiles add column if not exists telefone text;
