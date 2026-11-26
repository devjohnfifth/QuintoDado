-- =====================================================================
-- As policies passam a entender `vis = 'jogadores'`.
--
-- Segunda metade de 20261124130000 — o valor do enum é criado lá, e aqui
-- ele é usado. Separado porque o Postgres recusa as duas coisas na mesma
-- transação.
--
-- A leitura ganha um ramo só: `vis = 'jogadores' and eh_membro_da_mesa()`.
-- Nada mais muda — 'oculto', 'especificos' e 'mesa' seguem idênticos, e o
-- ramo do mestre continua na frente de tudo.
-- =====================================================================

-- ---------- Campos da ficha ---------------------------------------------
drop policy if exists painel_campo_leitura on painel_campos;
create policy painel_campo_leitura on painel_campos for select using (
  eh_mestre_da_mesa(mesa_id) or (
    painel_entidade_visivel(entidade_id)
    and (
      vis = 'mesa'
      or (vis = 'jogadores' and eh_membro_da_mesa(mesa_id))
      or (vis = 'especificos' and auth.uid() = any (revelado_para))
    )
  )
);

-- ---------- Relacionamentos ---------------------------------------------
-- As DUAS pontas precisam estar visíveis: senão o relacionamento entrega a
-- existência de um alvo que quem lê não deveria nem saber que existe.
drop policy if exists painel_relacionamento_leitura on painel_relacionamentos;
create policy painel_relacionamento_leitura on painel_relacionamentos for select using (
  eh_mestre_da_mesa(mesa_id) or (
    painel_entidade_visivel(origem_id) and painel_entidade_visivel(destino_id)
    and (
      vis = 'mesa'
      or (vis = 'jogadores' and eh_membro_da_mesa(mesa_id))
      or (vis = 'especificos' and auth.uid() = any (revelado_para))
    )
  )
);

-- ---------- Anotações ---------------------------------------------------
drop policy if exists painel_anotacao_leitura on painel_anotacoes;
create policy painel_anotacao_leitura on painel_anotacoes for select using (
  autor_id = auth.uid() or (
    pode_ver_painel(mesa_id)
    and (
      vis = 'mesa'
      or (vis = 'jogadores' and eh_membro_da_mesa(mesa_id))
      or (vis = 'especificos' and auth.uid() = any (revelado_para))
    )
  )
);

-- ---------- O que o jogador escreve -------------------------------------
-- Antes o campo criado por jogador era obrigatoriamente 'mesa', pra ele não
-- criar segredo que o mestre não controla. 'jogadores' não é segredo do
-- mestre — ele é membro da mesa e lê igual —, é só a ficha do jogador não
-- ficar exposta a quem passou pelo painel de fora. Então entra na lista.
drop policy if exists painel_campo_membro_cria on painel_campos;
create policy painel_campo_membro_cria on painel_campos for insert with check (
  eh_membro_da_mesa(mesa_id)
  and vis in ('mesa', 'jogadores')
  and painel_entidade_do_membro(entidade_id)
);

drop policy if exists painel_campo_membro_edita on painel_campos;
create policy painel_campo_membro_edita on painel_campos for update
  using (eh_membro_da_mesa(mesa_id) and painel_entidade_do_membro(entidade_id))
  with check (
    eh_membro_da_mesa(mesa_id)
    and vis in ('mesa', 'jogadores')
    and painel_entidade_do_membro(entidade_id)
  );

comment on type visibilidade_painel is
  'Do mais fechado pro mais aberto: oculto (só o mestre) · especificos (jogadores nomeados) · jogadores (quem joga na mesa) · mesa (quem tem conta no site).';
