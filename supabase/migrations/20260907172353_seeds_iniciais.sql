-- =====================================================================
-- Seeds iniciais — sistemas que o Quinto Dado mestra hoje (ver
-- docs/Especificacao-Completa_QuintoDado_v1.md §2). licenca_aberta fica
-- em branco de propósito: é informação jurídica (qual licença aberta cobre
-- material pago daquele sistema) que precisa ser confirmada por sistema
-- antes de vincular a um suplemento pago, não algo pra deduzir aqui.
-- =====================================================================

insert into sistemas (nome, slug, ativo) values
  ('Ordem Paranormal / OP2', 'ordem-paranormal-2', true),
  ('Tormenta 20', 'tormenta-20', true),
  ('Vaesen', 'vaesen', true),
  ('Fabula Ultima', 'fabula-ultima', true),
  ('Daggerheart', 'daggerheart', true),
  ('Sacramento RPG', 'sacramento-rpg', true)
on conflict (slug) do nothing;
