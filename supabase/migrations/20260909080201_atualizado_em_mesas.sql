-- A edição de mesa (nova nesta sessão) não tinha como registrar QUANDO
-- uma mesa foi editada pela última vez — mesas.criado_em só marca a
-- criação, e o sitemap usa essa data como lastModified. Sem isso, editar
-- uma mesa não avisa o Google que a página mudou (o sinal de "conteúdo
-- fresco" que o changeFrequency:"daily" promete fica furado).
--
-- Trigger em vez de setar manualmente em cada action: cobre qualquer
-- futuro caminho de UPDATE em mesas, não só o atualizarMesaAction de hoje.
alter table mesas add column if not exists atualizado_em timestamptz not null default now();

create or replace function marcar_mesa_atualizada() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists mesas_atualizado_em on mesas;
create trigger mesas_atualizado_em
  before update on mesas
  for each row
  execute function marcar_mesa_atualizada();
