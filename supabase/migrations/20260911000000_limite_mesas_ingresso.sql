-- Cada tipo de ingresso pode limitar quantas mesas do evento dá pra se
-- candidatar com ele (ex.: ingresso básico só entra em 1 mesa, o mais caro
-- não tem limite). Nulo = sem limite.
alter table evento_ingresso_tipos
  add column if not exists limite_mesas integer check (limite_mesas is null or limite_mesas > 0);
