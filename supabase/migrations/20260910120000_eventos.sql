-- Feature "Eventos" (UAIventura é o primeiro): página de evento com venda
-- manual de ingresso (Pix + comprovante por WhatsApp + aprovação manual do
-- admin — mesmo padrão já usado em mesas presenciais, não é integração de
-- pagamento) e mesas presenciais vinculáveis ao dia do evento.
create type status_evento as enum ('rascunho','publicado','encerrado','cancelado');
create type status_ingresso as enum ('pendente','aprovado','recusado','cancelado');

create table eventos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  criado_por uuid not null references profiles(id),
  titulo text not null,
  subtitulo text,
  descricao text not null,
  banner_url text,
  cidade_uf text not null,
  local text,
  data_inicio date not null,
  data_fim date,
  horario_inicio time,
  horario_fim time,
  status status_evento not null default 'rascunho',
  chave_pix text,
  whatsapp_confirmacao text,
  -- Opcional — quando preenchido, a página pública mostra "vagas limitadas"
  -- e para de vender ingresso (pendente + aprovado) quando bater o total.
  capacidade_maxima int check (capacidade_maxima is null or capacidade_maxima > 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table evento_ingresso_tipos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  nome text not null,
  descricao text,
  preco_centavos integer not null check (preco_centavos > 0),
  moeda char(3) not null default 'BRL',
  ordem int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Um pedido de ingresso por pessoa por evento (mesmo raciocínio do
-- unique (mesa_id, usuario_id) de inscricoes) — quem quiser levar alguém
-- junto pede um ingresso por perfil, não múltiplos pelo mesmo perfil.
create table evento_ingressos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  tipo_id uuid not null references evento_ingresso_tipos(id),
  usuario_id uuid not null references profiles(id),
  status status_ingresso not null default 'pendente',
  motivo_recusa text,
  aprovado_em timestamptz,
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

-- Mesa presencial pode (opcionalmente) pertencer a um evento — a
-- candidatura nessa mesa passa a exigir ingresso aprovado pro mesmo evento.
alter table mesas add column if not exists evento_id uuid references eventos(id);

alter table eventos enable row level security;
alter table evento_ingresso_tipos enable row level security;
alter table evento_ingressos enable row level security;

create policy evento_leitura on eventos for select
  using (status = 'publicado' or eh_admin());
create policy evento_admin on eventos for all
  using (eh_admin()) with check (eh_admin());

create policy evento_ingresso_tipo_leitura on evento_ingresso_tipos for select
  using (
    (ativo and exists (select 1 from eventos e where e.id = evento_id and e.status = 'publicado'))
    or eh_admin()
  );
create policy evento_ingresso_tipo_admin on evento_ingresso_tipos for all
  using (eh_admin()) with check (eh_admin());

create policy evento_ingresso_propria on evento_ingressos for select
  using (usuario_id = auth.uid() or eh_admin());
-- status fixado em 'pendente' no próprio check — sem isso, alguém poderia
-- inserir já como 'aprovado' direto pela API, sem passar pela revisão do
-- admin (mesmo raciocínio do gate de idade em inscricao_cria).
create policy evento_ingresso_cria on evento_ingressos for insert
  with check (usuario_id = auth.uid() and status = 'pendente');
create policy evento_ingresso_admin_avalia on evento_ingressos for update
  using (eh_admin());

create index on eventos (status, data_inicio);
create index on evento_ingressos (evento_id, status);
create index on mesas (evento_id);

-- Conta pendente + aprovado (não só aprovado) pra não vender além da
-- capacidade enquanto comprovantes ainda estão em análise — mesmo raciocínio
-- de "computed column" já usado em vagas_preenchidas(mesas).
create or replace function ingressos_vendidos(e eventos) returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from evento_ingressos
  where evento_id = e.id and status in ('pendente', 'aprovado');
$$;

grant execute on function ingressos_vendidos(eventos) to anon, authenticated, service_role;
