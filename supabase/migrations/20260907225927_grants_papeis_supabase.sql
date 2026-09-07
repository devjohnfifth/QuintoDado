-- =====================================================================
-- Corrige um bug real descoberto ao ligar o primeiro projeto Supabase de
-- verdade: as tabelas criadas pela migração inicial não tinham nenhum
-- GRANT pros papéis anon/authenticated/service_role — nem o service_role
-- (que ignora RLS) conseguia ler ("permission denied for table mesas").
-- Isso é diferente de RLS bloqueando por policy: é uma permissão de nível
-- de tabela que precisa existir ANTES da RLS ser avaliada.
--
-- Seguro conceder amplamente aqui porque toda tabela já tem RLS ligado
-- com policy de negar por padrão (ver modelo_inicial.sql) — é exatamente
-- o modelo padrão do Supabase: GRANT abre a porta, RLS decide quem entra.
-- O `alter default privileges` garante que tabelas de migrações futuras
-- já nasçam com o grant certo, sem precisar lembrar disso de novo.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
