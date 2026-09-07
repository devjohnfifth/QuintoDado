-- =====================================================================
-- Quinto Dado — Modelo de dados v1 (Supabase / PostgreSQL)
-- Documento de referência para o Claude Code.
-- Valores monetários SEMPRE em centavos (integer). Nunca float.
-- RLS: negar por padrão, liberar explicitamente.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------------------------------------------------
create type papel_usuario     as enum ('usuario','mestre','admin');
create type classificacao     as enum ('livre','14','16','18');
create type tipo_mesa         as enum ('one_shot','aventura','campanha');
create type modalidade_mesa   as enum ('online','presencial');
create type modelo_cobranca   as enum ('por_sessao','mesa_fechada','mensalidade');
create type frequencia_mesa   as enum ('unica','semanal','quinzenal','mensal');
create type nivel_experiencia as enum ('iniciante','intermediario','avancado','todos');
create type status_mesa       as enum ('rascunho','aguardando_aprovacao','publicada','confirmada','em_andamento','concluida','cancelada');
create type status_inscricao  as enum ('candidatura_enviada','aguardando_pagamento','pago_em_analise','aprovado','recusado','expirada','cancelada_jogador','cancelada_mestre','reembolsada','concluida');
create type status_pagamento  as enum ('pendente','pago','expirado','estornado','estorno_parcial','falhou');
create type tipo_suplemento   as enum ('tabela_encontros','tabela_loot','mapa','arte','homebrew','aventura','ficha','token','modulo_vtt');
create type tipo_pergunta     as enum ('texto_curto','texto_longo','escolha_unica','escolha_multipla');
create type idioma_conteudo   as enum ('pt-BR','en-US');

-- ---------- PERFIS ---------------------------------------------------
create table profiles (
  id             uuid primary key references auth.users on delete cascade,
  username       text unique not null,
  nome_exibicao  text not null,
  avatar_url     text,
  bio            text,
  data_nascimento date not null,             -- dirige o gating etário
  papel          papel_usuario not null default 'usuario',
  perfil_publico boolean not null default true,
  sistemas_favoritos text[] default '{}',
  criado_em      timestamptz not null default now()
);

-- idade em anos completos; usada por policies e por queries de catálogo
create or replace function idade_de(uid uuid) returns int
language sql stable security definer as $$
  select extract(year from age(current_date, data_nascimento))::int
  from profiles where id = uid;
$$;

-- classificações que o usuário atual pode ver
create or replace function classificacoes_permitidas() returns classificacao[]
language sql stable as $$
  select case
    when auth.uid() is null then array['livre','14']::classificacao[]
    when idade_de(auth.uid()) >= 18 then array['livre','14','16','18']::classificacao[]
    when idade_de(auth.uid()) >= 16 then array['livre','14','16']::classificacao[]
    else array['livre','14']::classificacao[]
  end;
$$;

create or replace function eh_admin() returns boolean
language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and papel = 'admin');
$$;

-- ---------- TAXONOMIA ------------------------------------------------
create table sistemas (
  id uuid primary key default gen_random_uuid(),
  nome text not null, slug text unique not null,
  licenca_aberta text,                        -- 'CC-BY-4.0 SRD 5.1', 'ORC', etc.
  ativo boolean not null default true
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null, slug text unique not null,
  categoria text not null                     -- 'tema' | 'estilo' | 'seguranca'
);

-- ---------- CONTEÚDO INSTITUCIONAL -----------------------------------
create table links (
  id uuid primary key default gen_random_uuid(),
  titulo text not null, url text not null, icone text,
  destaque_home boolean not null default false,
  ordem int not null default 0, ativo boolean not null default true
);

create table depoimentos (
  id uuid primary key default gen_random_uuid(),
  autor text not null, texto text, video_url text,
  origem text,                                -- 'MesaQuest' | 'WhatsApp' | 'aluno'
  ordem int not null default 0, publicado boolean not null default false
);

-- ---------- SUPLEMENTOS ----------------------------------------------
create table suplementos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  resumo text not null,
  descricao_md text,
  tipo tipo_suplemento not null,
  sistema_id uuid references sistemas(id),
  classificacao classificacao not null default 'livre',
  capa_url text,
  gratuito boolean not null default true,
  preco_centavos int not null default 0,
  moeda char(3) not null default 'BRL',
  usa_ia boolean not null default false,      -- exibido na página (transparência)
  licenca_base text,                          -- obrigatório quando gratuito = false
  atribuicao text,                            -- obrigatório quando gratuito = false
  idioma idioma_conteudo not null default 'pt-BR',
  publicado boolean not null default false,
  publicado_em timestamptz,
  downloads_count int not null default 0,
  criado_em timestamptz not null default now(),
  constraint pago_exige_licenca check (gratuito or (licenca_base is not null and atribuicao is not null)),
  constraint pago_exige_preco   check (gratuito or preco_centavos > 0)
);

create table suplemento_tags (
  suplemento_id uuid references suplementos(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (suplemento_id, tag_id)
);

create table arquivos_suplemento (
  id uuid primary key default gen_random_uuid(),
  suplemento_id uuid not null references suplementos(id) on delete cascade,
  nome text not null,
  chave_r2 text not null,                     -- caminho no bucket
  formato text not null,                      -- pdf | png | webp | json | zip
  tamanho_bytes bigint,
  eh_preview boolean not null default false,  -- amostra pública de item pago
  ordem int not null default 0
);

-- Tabelas aleatórias: dados estruturados, jogáveis no site e origem do PDF
create table tabelas_aleatorias (
  id uuid primary key default gen_random_uuid(),
  suplemento_id uuid not null references suplementos(id) on delete cascade,
  titulo text not null,
  dado text not null,                         -- 'd20' | 'd66' | 'd100'
  colunas text[] not null default '{"Resultado"}',
  itens_livres int not null default 0,        -- quantos itens ficam visíveis sem comprar
  ordem int not null default 0
);

create table tabela_itens (
  id uuid primary key default gen_random_uuid(),
  tabela_id uuid not null references tabelas_aleatorias(id) on delete cascade,
  faixa_min int not null,
  faixa_max int not null,
  valores text[] not null,                    -- uma entrada por coluna
  tabela_aninhada_id uuid references tabelas_aleatorias(id),
  check (faixa_min <= faixa_max)
);

create table kits (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, titulo text not null, resumo text,
  capa_url text, sistema_id uuid references sistemas(id),
  gratuito boolean not null default true,
  preco_centavos int not null default 0,
  publicado boolean not null default false
);

create table kit_suplementos (
  kit_id uuid references kits(id) on delete cascade,
  suplemento_id uuid references suplementos(id) on delete cascade,
  ordem int not null default 0,
  primary key (kit_id, suplemento_id)
);

create table compras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id),
  suplemento_id uuid references suplementos(id),
  kit_id uuid references kits(id),
  pagamento_id uuid,                           -- FK adicionada após pagamentos
  valor_centavos int not null,
  criado_em timestamptz not null default now(),
  reembolsado_em timestamptz,
  check (suplemento_id is not null or kit_id is not null)
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references profiles(id),
  arquivo_id uuid not null references arquivos_suplemento(id),
  ip_hash text, criado_em timestamptz not null default now()
);

create table favoritos (
  usuario_id uuid references profiles(id) on delete cascade,
  suplemento_id uuid references suplementos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, suplemento_id)
);

-- ---------- MESAS ----------------------------------------------------
create table mesas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  mestre_id uuid not null references profiles(id),
  titulo text not null,
  banner_url text,
  sinopse text not null,
  sistema_id uuid not null references sistemas(id),
  tipo tipo_mesa not null,
  modalidade modalidade_mesa not null default 'online',
  cidade_uf text,                              -- obrigatório se presencial
  plataforma_vtt text, plataforma_voz text,
  classificacao classificacao not null default 'livre',
  nivel_experiencia nivel_experiencia not null default 'todos',
  vagas_total int not null check (vagas_total between 1 and 12),
  min_jogadores int not null default 3,
  -- 0 = gratuita. Entre 1 e 499 não existe (evita cobrança de centavos sem
  -- sentido); a partir de 500 é R$5,00, o mínimo de mesa paga pelo site.
  preco_centavos int not null default 0 check (preco_centavos = 0 or preco_centavos >= 500),
  moeda char(3) not null default 'BRL',
  modelo_cobranca modelo_cobranca not null default 'por_sessao',
  -- false = mesa presencial autogerenciada por um mestre (ex. aba "Presencial
  -- BH"): o valor em preco_centavos é só informativo, combinado no local —
  -- não passa pelo fluxo de Pix/webhook nem entra na fila de aguardando_pagamento.
  cobranca_gerenciada_pelo_site boolean not null default true,
  frequencia frequencia_mesa not null default 'unica',
  qtd_sessoes int,
  data_inicio date not null,
  horario_inicio time not null, horario_fim time not null,
  fuso text not null default 'America/Sao_Paulo',
  idioma idioma_conteudo not null default 'pt-BR',   -- mesa em inglês é registro próprio
  -- Campos sensíveis: só visíveis a inscritos aprovados (ver policy abaixo)
  mensagem_boas_vindas text,
  whatsapp_mestre text,
  link_grupo_wpp text,
  status status_mesa not null default 'rascunho',
  aprovada_por uuid references profiles(id),
  aprovada_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint presencial_exige_local check (modalidade <> 'presencial' or cidade_uf is not null)
);

create table mesa_tags (
  mesa_id uuid references mesas(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (mesa_id, tag_id)
);

create table mesa_sessoes (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  numero int not null,
  data_hora_inicio timestamptz not null,
  data_hora_fim timestamptz not null,
  realizada boolean not null default false
);

-- Ficha de inscrição personalizada. As duas perguntas padrão
-- (linhas e véus / experiência) são semeadas com obrigatoria = true e fixa = true.
create table mesa_perguntas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  enunciado text not null,
  tipo tipo_pergunta not null default 'texto_longo',
  opcoes text[],
  obrigatoria boolean not null default false,
  fixa boolean not null default false,
  ordem int not null default 0
);

create table inscricoes (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  usuario_id uuid not null references profiles(id),
  status status_inscricao not null default 'candidatura_enviada',
  motivo_recusa text,
  aprovado_em timestamptz, cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (mesa_id, usuario_id)
);

create table inscricao_respostas (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null references inscricoes(id) on delete cascade,
  pergunta_id uuid not null references mesa_perguntas(id),
  resposta text
);

-- Consentimento do responsável — obrigatório para menor de 18 em mesa paga
create table consentimentos_responsavel (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null references inscricoes(id) on delete cascade,
  responsavel_nome text not null,
  responsavel_cpf text not null,
  responsavel_email text not null,
  token_confirmacao text not null unique,
  confirmado_em timestamptz,
  ip_confirmacao text,
  criado_em timestamptz not null default now()
);

-- ---------- PAGAMENTOS -----------------------------------------------
create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id),
  inscricao_id uuid references inscricoes(id),
  compra_id uuid references compras(id),
  provedor text not null default 'asaas',
  provedor_cobranca_id text unique,
  metodo text not null default 'pix',
  valor_centavos int not null,
  taxa_gateway_centavos int not null default 0,
  taxa_plataforma_centavos int not null default 0,
  moeda char(3) not null default 'BRL',
  status status_pagamento not null default 'pendente',
  pix_qrcode text, pix_copia_cola text,
  expira_em timestamptz,
  pago_em timestamptz,
  estornado_em timestamptz,
  valor_estornado_centavos int not null default 0,
  motivo_estorno text,
  -- campos fiscais para o futuro (MEI / nota fiscal)
  nf_numero text, nf_emitida_em timestamptz,
  criado_em timestamptz not null default now(),
  check (inscricao_id is not null or compra_id is not null)
);

alter table compras add constraint compras_pagamento_fk
  foreign key (pagamento_id) references pagamentos(id);

-- Idempotência de webhook
create table webhook_eventos (
  id text primary key,                        -- id do evento no provedor
  provedor text not null,
  payload jsonb not null,
  processado_em timestamptz
);

-- Faixas de comissão, editáveis sem deploy (ver §2.2 do documento de projeto)
create table faixas_comissao (
  id serial primary key,
  valor_min_centavos int not null,
  valor_max_centavos int,                     -- null = sem teto
  percentual numeric(5,2) not null
);
insert into faixas_comissao (valor_min_centavos, valor_max_centavos, percentual) values
  (500,   999,  0.00),
  (1000, 1999,  8.00),
  (2000, 4999, 10.00),
  (5000, null, 15.00);

-- Repasse ao mestre. Fase 1: só admin, comissão 0, sem terceiros.
-- Fase 2: preencher via split nativo do gateway, com data de liberação agendada
-- para 24h após o fim da sessão. NUNCA por transferência manual da conta pessoal.
create table repasses (
  id uuid primary key default gen_random_uuid(),
  mestre_id uuid not null references profiles(id),
  pagamento_id uuid not null references pagamentos(id),
  valor_bruto_centavos int not null,
  taxa_plataforma_centavos int not null,
  valor_liquido_centavos int not null,
  liberar_em timestamptz not null,            -- 24h após o fim da sessão (regra única)
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ---------- NOTIFICAÇÕES, ANALYTICS, AUDITORIA -----------------------
create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id) on delete cascade,
  tipo text not null,
  titulo text not null, corpo text not null, url text,
  enviar_em timestamptz not null default now(),   -- suporta agendamento (lembretes)
  enviado_email_em timestamptz,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);

create table eventos_analytics (
  id bigserial primary key,
  nome text not null,                          -- 'view_mesa','download','candidatura',...
  usuario_id uuid references profiles(id),
  entidade_tipo text, entidade_id uuid,
  meta jsonb,
  criado_em timestamptz not null default now()
);

create table aceites_termos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references profiles(id) on delete cascade,
  documento text not null,                     -- 'termos' | 'privacidade' | 'reembolso'
  versao text not null,
  ip text,
  criado_em timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  ator_id uuid references profiles(id),
  acao text not null,
  entidade_tipo text, entidade_id uuid,
  antes jsonb, depois jsonb,
  criado_em timestamptz not null default now()
);

-- ---------- ÍNDICES --------------------------------------------------
create index on mesas (status, data_inicio);
create index on mesas (sistema_id);
create index on mesas (classificacao);
create index on mesas (idioma);
create index on mesas (modalidade, cidade_uf);
create index on suplementos (publicado, publicado_em desc);
create index on suplementos (tipo, sistema_id);
create index on inscricoes (mesa_id, status);
create index on pagamentos (status, expira_em);
create index on notificacoes (usuario_id, lida_em);
create index on eventos_analytics (nome, criado_em desc);

-- =====================================================================
-- RLS — negar por padrão
-- =====================================================================
alter table profiles                enable row level security;
alter table suplementos             enable row level security;
alter table arquivos_suplemento     enable row level security;
alter table tabelas_aleatorias      enable row level security;
alter table tabela_itens            enable row level security;
alter table kits                    enable row level security;
alter table compras                 enable row level security;
alter table downloads               enable row level security;
alter table favoritos               enable row level security;
alter table mesas                   enable row level security;
alter table mesa_perguntas          enable row level security;
alter table inscricoes              enable row level security;
alter table inscricao_respostas     enable row level security;
alter table consentimentos_responsavel enable row level security;
alter table pagamentos              enable row level security;
alter table repasses                enable row level security;
alter table notificacoes            enable row level security;
alter table aceites_termos          enable row level security;
alter table audit_log               enable row level security;

-- Perfis
create policy perfil_leitura_publica on profiles for select
  using (perfil_publico or id = auth.uid() or eh_admin());
create policy perfil_edita_proprio on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and papel = (select papel from profiles where id = auth.uid()));

-- Suplementos: publicados e dentro da faixa etária permitida
create policy suplemento_leitura on suplementos for select
  using ((publicado and classificacao = any (classificacoes_permitidas())) or eh_admin());
create policy suplemento_admin on suplementos for all
  using (eh_admin()) with check (eh_admin());

-- Arquivos: preview é público; arquivo completo exige gratuito ou compra
create policy arquivo_leitura on arquivos_suplemento for select using (
  eh_admin() or exists (
    select 1 from suplementos s where s.id = suplemento_id
      and s.publicado and s.classificacao = any (classificacoes_permitidas())
      and (eh_preview or s.gratuito or exists (
        select 1 from compras c
        where c.usuario_id = auth.uid() and c.suplemento_id = s.id and c.reembolsado_em is null
      ))
  )
);

-- Mesas: públicas quando publicadas e dentro da faixa etária.
-- Os campos sensíveis (whatsapp_mestre, link_grupo_wpp, mensagem_boas_vindas)
-- NÃO são protegidos por policy de coluna — devem ser servidos por uma VIEW
-- pública sem eles, e lidos apenas no servidor após checar inscrição aprovada.
create policy mesa_leitura on mesas for select using (
  eh_admin() or mestre_id = auth.uid()
  or (status in ('publicada','confirmada','em_andamento')
      and classificacao = any (classificacoes_permitidas()))
);
create policy mesa_mestre_edita on mesas for update
  using (mestre_id = auth.uid() or eh_admin());

-- Criação: admin cria qualquer mesa; um usuário com papel 'mestre' só cria
-- mesa em nome dele mesmo (mestre_id = auth.uid()). Toda mesa nasce em
-- 'rascunho'/'aguardando_aprovacao' e passa pela aprovação do admin (ver
-- status_mesa) antes de virar pública — vale também pra mesa presencial
-- autogerenciada (aba "Presencial BH").
create policy mesa_cria on mesas for insert
  with check (
    eh_admin()
    or (
      mestre_id = auth.uid()
      and exists (select 1 from profiles p where p.id = auth.uid() and p.papel in ('mestre', 'admin'))
    )
  );

-- Perguntas da ficha: leitura acompanha a visibilidade da própria mesa
-- (candidato precisa ver a pergunta pra responder na inscrição).
create policy mesa_pergunta_leitura on mesa_perguntas for select using (
  exists (
    select 1 from mesas m where m.id = mesa_id
      and (
        eh_admin() or m.mestre_id = auth.uid()
        or (m.status in ('publicada', 'confirmada', 'em_andamento')
            and m.classificacao = any (classificacoes_permitidas()))
      )
  )
);
-- Escrita (inclui semear as duas perguntas fixas — linhas e véus,
-- experiência — na criação) é só de quem é dono da mesa ou admin.
create policy mesa_pergunta_gerencia on mesa_perguntas for all using (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
) with check (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
);

-- Inscrições: o jogador vê a sua; o mestre vê as da mesa dele
create policy inscricao_leitura on inscricoes for select using (
  usuario_id = auth.uid() or eh_admin()
  or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
);
create policy inscricao_cria on inscricoes for insert
  with check (usuario_id = auth.uid());
-- Mestre da mesa (ou admin) avalia a candidatura — aprova/recusa.
create policy inscricao_mestre_avalia on inscricoes for update using (
  eh_admin() or exists (select 1 from mesas m where m.id = mesa_id and m.mestre_id = auth.uid())
);

-- Respostas da ficha (inclui linhas e véus — dado sensível)
create policy resposta_leitura on inscricao_respostas for select using (
  eh_admin() or exists (
    select 1 from inscricoes i join mesas m on m.id = i.mesa_id
    where i.id = inscricao_id and (i.usuario_id = auth.uid() or m.mestre_id = auth.uid())
  )
);
-- Jogador responde a própria ficha (só dele, e só na hora que cria a inscrição).
create policy resposta_cria on inscricao_respostas for insert with check (
  exists (
    select 1 from inscricoes i where i.id = inscricao_id and i.usuario_id = auth.uid()
  )
);

-- Financeiro: só o dono e o admin. Escrita apenas via service_role.
create policy pagamento_leitura on pagamentos for select
  using (usuario_id = auth.uid() or eh_admin());
create policy repasse_leitura on repasses for select
  using (mestre_id = auth.uid() or eh_admin());
create policy compra_leitura on compras for select
  using (usuario_id = auth.uid() or eh_admin());

-- Pessoais
create policy notificacao_propria on notificacoes for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy favorito_proprio on favoritos for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy aceite_proprio on aceites_termos for select
  using (usuario_id = auth.uid() or eh_admin());
create policy auditoria_admin on audit_log for select using (eh_admin());
create policy consentimento_leitura on consentimentos_responsavel for select using (
  eh_admin() or exists (
    select 1 from inscricoes i where i.id = inscricao_id and i.usuario_id = auth.uid()
  )
);

-- =====================================================================
-- REGRAS QUE VIVEM NA APLICAÇÃO (não no banco) — implementar no servidor
-- =====================================================================
-- 1. Cálculo de comissão: consultar faixas_comissao; mesa do admin => 0%.
-- 2. Expiração de cobrança Pix: 30 min => inscricao vira 'expirada'.
-- 3. Recusa do mestre => estorno integral em até 24h.
-- 4. 24h antes do início: aprovados < min_jogadores => mesa cancelada
--    + estorno integral de todos.
-- 5. Reembolso por cancelamento do jogador:
--       >= 7 dias da sessão .......... 100%
--       48h a 7 dias ................. 100% menos taxa do gateway
--       < 48h ........................ 50%
--       no-show ...................... 0%
--    Arrependimento CDC art. 49: 100% se dentro de 7 dias do pagamento
--    E faltando >= 48h para a sessão. Sempre prevalece o mais favorável
--    ao consumidor.
-- 6. Suplemento pago: reembolso integral em até 7 dias da compra,
--    honrado mesmo com download registrado.
-- 7. Menor de 18 em mesa paga: inscrição não avança para 'aprovado'
--    sem consentimentos_responsavel.confirmado_em preenchido.
-- 8. Briefing (whatsapp_mestre, link_grupo_wpp) só é servido ao usuário
--    cuja inscrição está 'aprovado'. Nunca incluir esses campos em
--    endpoint público, RSC payload, sitemap ou JSON-LD.
-- 9. Webhook é a fonte da verdade do pagamento. Validar assinatura,
--    registrar em webhook_eventos, tratar reentrega como no-op.
-- 10. repasses.liberar_em = fim da última sessão + 24h. Regra única para
--     admin e para mestres convidados. A retenção existe para financiar
--     estornos; não a remova.
-- =====================================================================
