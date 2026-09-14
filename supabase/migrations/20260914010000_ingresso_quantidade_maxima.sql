-- Cada tipo de ingresso pode ter uma quantidade máxima própria (ex.: só 50
-- "Mestre do pão de queijo"), independente da capacidade geral do evento.
-- Mesmo raciocínio de eventos.capacidade_maxima/ingressos_vendidos, só que
-- por tipo em vez de por evento inteiro.
alter table evento_ingresso_tipos
  add column if not exists quantidade_maxima int
  check (quantidade_maxima is null or quantidade_maxima > 0);

-- Conta pendente + aprovado (não só aprovado) pra não vender além do limite
-- enquanto comprovantes ainda estão em análise — mesma lógica de
-- ingressos_vendidos(eventos).
create or replace function ingressos_vendidos_tipo(t evento_ingresso_tipos) returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from evento_ingressos
  where tipo_id = t.id and status in ('pendente', 'aprovado');
$$;

grant execute on function ingressos_vendidos_tipo(evento_ingresso_tipos) to anon, authenticated, service_role;
