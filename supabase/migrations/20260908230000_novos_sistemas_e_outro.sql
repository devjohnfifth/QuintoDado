-- Novos sistemas fixos + opção "Outro" pra mestre digitar um sistema que
-- ainda não está no catálogo. "Outro" é uma linha real em `sistemas` (assim
-- o form continua só escolhendo um sistema_id), mas quando ela é escolhida
-- o texto livre digitado vai pra essa coluna nova — sistema_id sozinho não
-- basta pra saber qual sistema é de verdade nesse caso.

alter table mesas add column if not exists sistema_outro text;

insert into sistemas (nome, slug, ativo) values
  ('Vampiro: A Máscara', 'vampiro-a-mascara', true),
  ('Pathfinder 2ª Edição', 'pathfinder-2e', true),
  ('Dungeons & Dragons 2024', 'dnd-2024', true),
  ('Chamado de Cthulhu', 'chamado-de-cthulhu', true),
  ('Outro', 'outro', true)
on conflict (slug) do nothing;
