-- =====================================================================
-- Mesa comissionada vendida fora do site (hoje, o MesaQuest).
--
-- A mesa aparece normalmente no Quinto Dado — com sinopse, sistema,
-- horário e o painel de campanha —, mas a vaga é garantida no outro
-- site. Sem isso, quem chega aqui simplesmente não vê o produto
-- principal, que é o que acontece hoje.
--
-- `null` = candidatura acontece aqui mesmo, como sempre foi.
-- =====================================================================

alter table mesas add column if not exists link_externo text;

comment on column mesas.link_externo is
  'URL onde a vaga é garantida (ex.: MesaQuest). Quando preenchida, a página da mesa troca o formulário de candidatura por um botão que leva pra lá.';
