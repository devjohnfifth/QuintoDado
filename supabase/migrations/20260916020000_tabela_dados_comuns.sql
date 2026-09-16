-- Tabelas aleatórias passam a aceitar os dados comuns (d4–d12) além de d20,
-- d66 e d100. As tabelas de Hacking Técnico do Instagram são d12.
alter table public.tabelas_aleatorias
  drop constraint tabela_dado_valido;

alter table public.tabelas_aleatorias
  add constraint tabela_dado_valido
  check (dado in ('d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd66', 'd100'));
