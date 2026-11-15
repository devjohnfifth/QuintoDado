-- Corrige o jeito de esconder coluna sensível: tabela própria, não grant por
-- coluna.
--
-- A migration anterior (20261115210000) fechou `whatsapp_mestre`,
-- `link_grupo_wpp` e `mensagem_boas_vindas` revogando o SELECT de `mesas` e
-- devolvendo coluna por coluna. Funciona pra leitura normal e quebra as
-- "computed columns": `vagas_preenchidas(m mesas)` e `jogadores_aprovados(m
-- mesas)` recebem a LINHA INTEIRA, e pra montar o record o Postgres exige
-- SELECT na tabela toda. O resultado era um erro seco na listagem pública:
--
--   GET /rest/v1/mesas?select=titulo,vagas_preenchidas
--   permission denied for table mesas
--
-- O mesmo buraco já existia em `eventos` desde 20261027120000, e estava
-- esperando o próximo evento publicado pra aparecer: a página pública lê
-- `ingressos_vendidos`, que é computed column de `eventos`, e dava o mesmo
-- "permission denied" pra visitante deslogado. Ninguém viu porque não há
-- evento publicado no ar — descoberto ao testar esta leva.
--
-- Então o dado sensível sai da tabela que tem computed column e vai pra uma
-- tabela satélite, com RLS própria. É o que o comentário do modelo inicial já
-- mandava fazer ("devem ser servidos por uma VIEW pública sem eles"), e tem
-- uma vantagem sobre o grant por coluna: a regra fica explícita numa policy
-- que dá pra testar, em vez de depender de uma lista de colunas que alguém
-- precisa lembrar de atualizar toda vez que a tabela crescer.

-- ---------------------------------------------------------------------------
-- 1. Contato da mesa — o que só quem foi aprovado pode ver.
-- ---------------------------------------------------------------------------
create table if not exists public.mesa_contato (
  mesa_id uuid primary key references public.mesas(id) on delete cascade,
  whatsapp_mestre text,
  link_grupo_wpp text,
  mensagem_boas_vindas text,
  atualizado_em timestamptz not null default now()
);

-- Leva o que já existisse (hoje: nada preenchido nas 6 mesas, conferido antes
-- de escrever isto — mas a cópia fica aqui porque migration não pode depender
-- do estado do banco de uma máquina só).
insert into public.mesa_contato (mesa_id, whatsapp_mestre, link_grupo_wpp, mensagem_boas_vindas)
select id, whatsapp_mestre, link_grupo_wpp, mensagem_boas_vindas
from public.mesas
where whatsapp_mestre is not null
   or link_grupo_wpp is not null
   or mensagem_boas_vindas is not null
on conflict (mesa_id) do nothing;

alter table public.mesas
  drop column if exists whatsapp_mestre,
  drop column if exists link_grupo_wpp,
  drop column if exists mensagem_boas_vindas;

alter table public.mesa_contato enable row level security;

-- Quem lê: admin, o mestre da mesa, e quem tem inscrição aprovada nela — que
-- é exatamente a regra 4 do CLAUDE.md ("só para inscrição com status
-- aprovado"), agora escrita onde o banco a aplica.
create policy mesa_contato_leitura on public.mesa_contato for select using (
  eh_admin()
  or exists (select 1 from public.mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
  or exists (
    select 1 from public.inscricoes i
    where i.mesa_id = mesa_contato.mesa_id
      and i.usuario_id = auth.uid()
      and i.status = 'aprovado'
  )
);

-- Quem escreve: o mestre da própria mesa e o admin.
create policy mesa_contato_escreve on public.mesa_contato for all
  using (
    eh_admin()
    or exists (select 1 from public.mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
  )
  with check (
    eh_admin()
    or exists (select 1 from public.mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
  );

-- Grant explícito em vez de confiar no `alter default privileges` de
-- 20260907225927: ele só vale pra objeto criado pelo mesmo usuário que rodou
-- aquele ALTER, e "permission denied" por falta de grant é justamente o bug
-- que aquela migration nasceu pra consertar. GRANT abre a porta, RLS decide
-- quem entra — as policies acima é que fazem o trabalho.
grant select, insert, update, delete on public.mesa_contato to authenticated, service_role;
grant select on public.mesa_contato to anon;

-- `mesas` volta a ter SELECT de tabela inteira: não sobrou nada sensível nela,
-- e é o que as computed columns precisam.
revoke select on public.mesas from anon, authenticated;
grant select on public.mesas to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Pagamento do evento — mesmo tratamento.
-- ---------------------------------------------------------------------------
create table if not exists public.evento_pagamento (
  evento_id uuid primary key references public.eventos(id) on delete cascade,
  chave_pix text,
  whatsapp_confirmacao text,
  atualizado_em timestamptz not null default now()
);

insert into public.evento_pagamento (evento_id, chave_pix, whatsapp_confirmacao)
select id, chave_pix, whatsapp_confirmacao
from public.eventos
where chave_pix is not null or whatsapp_confirmacao is not null
on conflict (evento_id) do nothing;

alter table public.eventos
  drop column if exists chave_pix,
  drop column if exists whatsapp_confirmacao;

alter table public.evento_pagamento enable row level security;

-- Mesma regra que a `dadosPagamentoAction` já aplicava no código: precisa
-- estar logado e o evento precisa estar publicado. A diferença é que agora o
-- banco também garante, em vez de confiar só na action.
create policy evento_pagamento_leitura on public.evento_pagamento for select using (
  eh_admin()
  or (
    auth.uid() is not null
    and exists (
      select 1 from public.eventos e
      where e.id = evento_id and e.status = 'publicado'
    )
  )
);

create policy evento_pagamento_admin on public.evento_pagamento for all
  using (eh_admin()) with check (eh_admin());

grant select, insert, update, delete on public.evento_pagamento to authenticated, service_role;
-- anon não entra aqui: a policy já barraria, mas sem grant a porta nem abre.

-- `eventos` volta ao SELECT de tabela inteira pelo mesmo motivo de `mesas`:
-- `ingressos_vendidos(e eventos)` precisa do record completo.
revoke select on public.eventos from anon, authenticated;
grant select on public.eventos to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fecha de verdade as funções pessoais.
-- ---------------------------------------------------------------------------
-- `revoke ... from anon` não bastou: toda função nasce com EXECUTE concedido
-- a PUBLIC, e anon herda daí. Na prática não vazava nada (sem sessão,
-- `auth.uid()` é nulo e a função não devolve linha), mas o certo é a chamada
-- nem chegar.
revoke execute on function public.minha_idade() from public, anon;
revoke execute on function public.meus_dados_pessoais() from public, anon;
grant execute on function public.minha_idade() to authenticated, service_role;
grant execute on function public.meus_dados_pessoais() to authenticated, service_role;
