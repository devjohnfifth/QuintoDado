-- Publicar um evento não libera as vendas automaticamente — é um
-- interruptor à parte que o admin liga/desliga quando quiser, mesmo
-- depois de publicado. Default false: todo evento nasce (e volta, toda
-- vez que é publicado de novo) com compras bloqueadas até o admin abrir.
alter table eventos add column if not exists vendas_abertas boolean not null default false;
