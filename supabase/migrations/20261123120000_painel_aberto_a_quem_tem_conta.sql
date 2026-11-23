-- =====================================================================
-- O painel da mesa passa a ser legível por qualquer pessoa com conta.
--
-- Até aqui o painel era fechado: só o mestre e quem tinha inscrição
-- aprovada liam qualquer coisa dele, e quem não era membro levava 404.
-- Isso protegia bem, mas escondia justamente o que mostra a comunidade
-- trabalhando — o elenco que o grupo construiu e o relato das sessões.
--
-- Agora: LER é de quem tem conta. ESCREVER continua sendo de quem joga.
-- Nenhuma policy de escrita é tocada aqui; todas seguem exigindo
-- `eh_membro_da_mesa()`, então espectador não cria, não edita e não apaga.
--
-- O que continua invisível pra quem não é da mesa é exatamente o que já
-- era invisível pro jogador:
--   · ficha com `oculta = true`         (segredo do mestre)
--   · campo com `vis = 'oculto'`        (idem)
--   · campo/relacionamento 'especificos' fora da lista `revelado_para`
--   · sessão com `publicado = false`    (rascunho do mestre)
--   · anotação com `vis = 'oculto'`     (privada do autor, nem o mestre lê)
--   · `painel_revelacoes`               (o log é só do mestre)
-- A regra de ouro do painel não muda: quem filtra é o banco, não a tela.
--
-- Vale só pra mesa que já está no ar. Mesa em rascunho, aguardando
-- aprovação ou cancelada continua fechada a quem não é dela — é a mesma
-- lista de status da policy `mesa_leitura`, pra não existirem duas
-- definições de "mesa pública" se contradizendo depois.
-- =====================================================================

-- `security definer` pelo mesmo motivo das outras funções do painel: ela
-- precisa ler `mesas` sem passar pela RLS de `mesas`, senão a visibilidade
-- do painel dependeria da visibilidade da linha da mesa.
create or replace function pode_ver_painel(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_membro_da_mesa(m) or (
    -- `auth.uid() is not null` é o "tem conta no site": visitante
    -- deslogado não lê nada do painel, e a página responde 404.
    auth.uid() is not null
    and exists (
      select 1 from mesas
      where id = m and status in ('publicada', 'confirmada', 'em_andamento')
    )
  );
$$;

comment on function pode_ver_painel(uuid) is
  'Quem pode LER o painel: membro da mesa, ou qualquer pessoa logada se a mesa já está no ar. Escrita continua em eh_membro_da_mesa().';

-- ---------- Elenco ------------------------------------------------------
-- Esta função é a que `painel_campos` e `painel_relacionamentos` usam pra
-- decidir se a ficha dona do dado é visível. Trocando o membro por
-- `pode_ver_painel` aqui, os campos revelados e os relacionamentos entre
-- fichas visíveis acompanham sozinhos — e o que está oculto segue oculto,
-- porque a condição `not x.oculta` continua intacta.
create or replace function painel_entidade_visivel(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from painel_entidades x
    where x.id = e and (eh_mestre_da_mesa(x.mesa_id) or (not x.oculta and pode_ver_painel(x.mesa_id)))
  );
$$;

drop policy if exists painel_entidade_leitura on painel_entidades;
create policy painel_entidade_leitura on painel_entidades for select using (
  eh_mestre_da_mesa(mesa_id) or (not oculta and pode_ver_painel(mesa_id))
);

-- `painel_campo_leitura` e `painel_relacionamento_leitura` não são
-- recriadas de propósito: as duas já decidem por `painel_entidade_visivel`
-- mais a própria `vis`, e as duas acabaram de acompanhar a mudança acima.
-- Reescrevê-las só criaria uma segunda cópia da mesma regra pra sair do ar.

-- ---------- Rótulos de relacionamento ----------------------------------
-- São o vocabulário da mesa ("pai de", "deve favor a"). Sem eles o
-- relacionamento visível apareceria sem nome.
drop policy if exists painel_rotulo_leitura on painel_rotulos;
create policy painel_rotulo_leitura on painel_rotulos for select
  using (pode_ver_painel(mesa_id));

-- ---------- Sessões -----------------------------------------------------
-- Rascunho segue sendo só do mestre: `publicado` é o que separa o que a
-- mesa decidiu contar do que ainda está sendo escrito.
drop policy if exists painel_sessao_leitura on painel_sessoes;
create policy painel_sessao_leitura on painel_sessoes for select using (
  eh_mestre_da_mesa(mesa_id) or (publicado and pode_ver_painel(mesa_id))
);

-- ---------- Anotações ---------------------------------------------------
-- A tabela está vazia e ainda não tem tela, então nada é exposto
-- retroativamente aqui. Fica com a mesma regra do resto do painel pra não
-- nascer uma exceção: 'oculto' é só do autor (nem o mestre lê),
-- 'especificos' é só de quem está na lista, e 'mesa' é o que o painel
-- mostra — que agora quer dizer "quem tem conta".
--
-- Quando a tela de anotação existir, o rótulo dela precisa dizer isso com
-- todas as letras. Chamar de "a mesa toda" o que qualquer pessoa logada lê
-- faria o autor escolher achando que está protegido.
drop policy if exists painel_anotacao_leitura on painel_anotacoes;
create policy painel_anotacao_leitura on painel_anotacoes for select using (
  autor_id = auth.uid() or (
    pode_ver_painel(mesa_id)
    and (vis = 'mesa' or (vis = 'especificos' and auth.uid() = any (revelado_para)))
  )
);

-- `painel_anotacao_cria` continua exigindo `eh_membro_da_mesa`, então
-- espectador lê e não escreve. Nem ela nem nenhuma outra policy de escrita
-- é alterada nesta migração.
