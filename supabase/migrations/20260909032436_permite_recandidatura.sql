-- Bug: jogador que sai da mesa ou é recusado fica travado pra sempre,
-- porque a unique (mesa_id, usuario_id) barra o INSERT de uma nova
-- candidatura mesmo com a anterior já encerrada. Troca por um índice
-- único parcial que só considera candidaturas ainda ativas.
alter table inscricoes drop constraint inscricoes_mesa_id_usuario_id_key;

create unique index inscricoes_ativa_unica on inscricoes (mesa_id, usuario_id)
  where status in ('candidatura_enviada', 'aguardando_pagamento', 'pago_em_analise', 'aprovado');
