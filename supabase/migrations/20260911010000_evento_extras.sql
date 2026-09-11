-- Personalização da página de evento: galeria de fotos, apoiadores/patrocinadores,
-- programação (atrações) e mestres confirmados (perfis reais da plataforma, não
-- texto livre — assim o rosto/nome já vem de um perfil existente).
create table evento_imagens (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  url text not null,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table evento_apoiadores (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  nome text not null,
  logo_url text not null,
  link text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table evento_atracoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  horario text,
  titulo text not null,
  descricao text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

-- usuario_id aponta pra um perfil de verdade — "mestre confirmado" é sempre
-- alguém já cadastrado no site, selecionado pelo admin, não nome digitado à mão.
create table evento_mestres (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  usuario_id uuid not null references profiles(id),
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

alter table evento_imagens enable row level security;
alter table evento_apoiadores enable row level security;
alter table evento_atracoes enable row level security;
alter table evento_mestres enable row level security;

create policy evento_imagem_leitura on evento_imagens for select
  using (exists (select 1 from eventos e where e.id = evento_id and (e.status = 'publicado' or eh_admin())));
create policy evento_imagem_admin on evento_imagens for all
  using (eh_admin()) with check (eh_admin());

create policy evento_apoiador_leitura on evento_apoiadores for select
  using (exists (select 1 from eventos e where e.id = evento_id and (e.status = 'publicado' or eh_admin())));
create policy evento_apoiador_admin on evento_apoiadores for all
  using (eh_admin()) with check (eh_admin());

create policy evento_atracao_leitura on evento_atracoes for select
  using (exists (select 1 from eventos e where e.id = evento_id and (e.status = 'publicado' or eh_admin())));
create policy evento_atracao_admin on evento_atracoes for all
  using (eh_admin()) with check (eh_admin());

create policy evento_mestre_leitura on evento_mestres for select
  using (exists (select 1 from eventos e where e.id = evento_id and (e.status = 'publicado' or eh_admin())));
create policy evento_mestre_admin on evento_mestres for all
  using (eh_admin()) with check (eh_admin());

create index on evento_imagens (evento_id, ordem);
create index on evento_apoiadores (evento_id, ordem);
create index on evento_atracoes (evento_id, ordem);
create index on evento_mestres (evento_id, ordem);
