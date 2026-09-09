-- Permite que um usuário comum sinalize interesse em virar mestre de
-- mesas presenciais em BH (CTA no gate de /presencial-bh/nova). Não é
-- uma tabela própria porque o "pedido" em si não precisa de histórico —
-- só de um timestamp pra saber que já foi feito (e não deixar duplicar)
-- e pra sumir sozinho quando o admin promove o usuário (nesse ponto
-- papel deixa de ser 'usuario' e o CTA some pela própria condição da UI).
alter table profiles add column if not exists mestre_solicitado_em timestamptz;
