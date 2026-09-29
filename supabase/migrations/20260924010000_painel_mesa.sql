-- =====================================================================
-- Painel da mesa — o mestre organiza a campanha (elenco, sessões,
-- relacionamentos, anotações) e o jogador vê só o que já foi revelado.
--
-- Regra de ouro (portada do projeto "Mesa"): o servidor NUNCA envia ao
-- jogador o que ele não pode ver. Nada de filtrar no front — se o dado
-- chegou no navegador, já vazou. Toda a regra vive aqui, em RLS.
--
-- Segunda regra: ausência total. Conteúdo oculto não deixa rastro — não
-- existe "campo oculto", cadeado ou buraco no layout. Saber que existe um
-- segredo já é informação.
--
-- Aqui não existe "campanha" própria: o painel é da `mesas`, e membro é
-- quem tem inscrição aprovada nela.
-- =====================================================================

create type visibilidade_painel as enum ('oculto', 'mesa', 'especificos');

-- ---------- Quem é quem -------------------------------------------------
-- `security definer` pelo mesmo motivo de eh_admin(): a função precisa ler
-- mesas/inscricoes ignorando a RLS dessas tabelas, senão a checagem de
-- visibilidade dependeria da visibilidade da própria linha.
create or replace function eh_mestre_da_mesa(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mesas where id = m and mestre_id = auth.uid()) or eh_admin();
$$;

create or replace function eh_membro_da_mesa(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_mestre_da_mesa(m) or exists (
    select 1 from inscricoes
    where mesa_id = m and usuario_id = auth.uid() and status = 'aprovado'
  );
$$;

-- ---------- Elenco ------------------------------------------------------
create table painel_entidades (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  tipo text not null check (tipo in ('npc', 'local', 'item', 'faccao', 'personagem')),
  nome text not null,
  imagem_url text,
  -- Nasce oculta de propósito: revelar é ato deliberado do mestre.
  oculta boolean not null default true,
  -- Bloco de ficha do sistema (força, PV...): visibilidade tudo-ou-nada,
  -- por isso cabe em jsonb. Campo comum é tabela, porque a visibilidade é
  -- por campo e precisa ser filtrada em SQL.
  atributos jsonb not null default '{}',
  ordem int not null default 0,
  criada_na_sessao int,
  criado_em timestamptz not null default now()
);

create table painel_campos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  entidade_id uuid not null references painel_entidades(id) on delete cascade,
  rotulo text not null,
  valor text,
  ordem int not null default 0,
  vis visibilidade_painel not null default 'oculto',
  revelado_para uuid[] not null default '{}'
);

-- ---------- Relacionamentos --------------------------------------------
-- O rótulo guarda o par inverso ("pai de" / "filha de"), então o mestre
-- nunca é perguntado duas vezes sobre a mesma ligação.
create table painel_rotulos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  nome text not null,
  inverso text not null,
  unique (mesa_id, nome)
);

create table painel_relacionamentos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  origem_id uuid not null references painel_entidades(id) on delete cascade,
  destino_id uuid not null references painel_entidades(id) on delete cascade,
  rotulo_id uuid not null references painel_rotulos(id) on delete cascade,
  vis visibilidade_painel not null default 'oculto',
  revelado_para uuid[] not null default '{}',
  check (origem_id <> destino_id)
);

-- ---------- Sessões -----------------------------------------------------
create table painel_sessoes (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  numero int not null,
  data date,
  resumo_md text,
  publicado boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (mesa_id, numero)
);

-- ---------- Anotações ---------------------------------------------------
create table painel_anotacoes (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id) on delete cascade,
  autor_id uuid not null references profiles(id) on delete cascade,
  entidade_id uuid references painel_entidades(id) on delete cascade,
  sessao_id uuid references painel_sessoes(id) on delete cascade,
  texto text not null,
  vis visibilidade_painel not null default 'oculto',
  revelado_para uuid[] not null default '{}',
  criado_em timestamptz not null default now()
);

-- ---------- Log de revelação -------------------------------------------
create table painel_revelacoes (
  id bigserial primary key,
  mesa_id uuid not null references mesas(id) on delete cascade,
  ator_id uuid references profiles(id) on delete set null,
  alvo_tipo text not null,
  alvo_id uuid not null,
  de text,
  para text,
  em timestamptz not null default now()
);

create index on painel_entidades (mesa_id, tipo, ordem);
create index on painel_campos (entidade_id, ordem);
create index on painel_relacionamentos (mesa_id, origem_id);
create index on painel_relacionamentos (mesa_id, destino_id);
create index on painel_sessoes (mesa_id, numero desc);
create index on painel_anotacoes (mesa_id, autor_id);
create index on painel_revelacoes (mesa_id, em desc);

-- =====================================================================
-- RLS — negar por padrão
-- =====================================================================
alter table painel_entidades       enable row level security;
alter table painel_campos          enable row level security;
alter table painel_rotulos         enable row level security;
alter table painel_relacionamentos enable row level security;
alter table painel_sessoes         enable row level security;
alter table painel_anotacoes       enable row level security;
alter table painel_revelacoes      enable row level security;

-- Uma entidade visível é: mestre vê tudo; jogador só vê o que não está oculto.
create or replace function painel_entidade_visivel(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from painel_entidades x
    where x.id = e and (eh_mestre_da_mesa(x.mesa_id) or (not x.oculta and eh_membro_da_mesa(x.mesa_id)))
  );
$$;

create policy painel_entidade_leitura on painel_entidades for select using (
  eh_mestre_da_mesa(mesa_id) or (not oculta and eh_membro_da_mesa(mesa_id))
);
create policy painel_entidade_escrita on painel_entidades for all
  using (eh_mestre_da_mesa(mesa_id)) with check (eh_mestre_da_mesa(mesa_id));

-- Campo exige a entidade visível E a própria visibilidade liberada: revelar
-- a entidade não revela junto tudo o que está escrito nela.
create policy painel_campo_leitura on painel_campos for select using (
  eh_mestre_da_mesa(mesa_id) or (
    painel_entidade_visivel(entidade_id)
    and (vis = 'mesa' or (vis = 'especificos' and auth.uid() = any (revelado_para)))
  )
);
create policy painel_campo_escrita on painel_campos for all
  using (eh_mestre_da_mesa(mesa_id)) with check (eh_mestre_da_mesa(mesa_id));

create policy painel_rotulo_leitura on painel_rotulos for select
  using (eh_membro_da_mesa(mesa_id));
create policy painel_rotulo_escrita on painel_rotulos for all
  using (eh_mestre_da_mesa(mesa_id)) with check (eh_mestre_da_mesa(mesa_id));

-- As DUAS pontas precisam estar visíveis: senão o relacionamento entrega a
-- existência de um alvo que o jogador não deveria nem saber que existe.
create policy painel_relacionamento_leitura on painel_relacionamentos for select using (
  eh_mestre_da_mesa(mesa_id) or (
    painel_entidade_visivel(origem_id) and painel_entidade_visivel(destino_id)
    and (vis = 'mesa' or (vis = 'especificos' and auth.uid() = any (revelado_para)))
  )
);
create policy painel_relacionamento_escrita on painel_relacionamentos for all
  using (eh_mestre_da_mesa(mesa_id)) with check (eh_mestre_da_mesa(mesa_id));

create policy painel_sessao_leitura on painel_sessoes for select using (
  eh_mestre_da_mesa(mesa_id) or (publicado and eh_membro_da_mesa(mesa_id))
);
create policy painel_sessao_escrita on painel_sessoes for all
  using (eh_mestre_da_mesa(mesa_id)) with check (eh_mestre_da_mesa(mesa_id));

-- Anotação privada de jogador não é lida NEM pelo mestre — ler estraga a
-- surpresa dos dois lados. Por isso a policy não tem escape de mestre.
create policy painel_anotacao_leitura on painel_anotacoes for select using (
  autor_id = auth.uid() or (
    eh_membro_da_mesa(mesa_id)
    and (vis = 'mesa' or (vis = 'especificos' and auth.uid() = any (revelado_para)))
  )
);
create policy painel_anotacao_cria on painel_anotacoes for insert with check (
  autor_id = auth.uid() and eh_membro_da_mesa(mesa_id)
);
create policy painel_anotacao_edita on painel_anotacoes for update
  using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy painel_anotacao_apaga on painel_anotacoes for delete
  using (autor_id = auth.uid());

-- O log é do mestre: pro jogador, saber que "algo foi revelado" já é pista.
create policy painel_revelacao_leitura on painel_revelacoes for select
  using (eh_mestre_da_mesa(mesa_id));

-- =====================================================================
-- Log automático de revelação (RNF9 do projeto Mesa)
-- `security definer` porque quem escreve é o trigger, não o usuário — não
-- existe policy de insert em painel_revelacoes de propósito.
-- =====================================================================
create or replace function registra_revelacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  de_txt text;
  para_txt text;
begin
  if tg_table_name = 'painel_entidades' then
    de_txt := case when old.oculta then 'oculto' else 'mesa' end;
    para_txt := case when new.oculta then 'oculto' else 'mesa' end;
  else
    de_txt := old.vis::text;
    para_txt := new.vis::text;
  end if;

  if de_txt is distinct from para_txt then
    insert into painel_revelacoes (mesa_id, ator_id, alvo_tipo, alvo_id, de, para)
    values (new.mesa_id, auth.uid(), tg_table_name, new.id, de_txt, para_txt);
  end if;

  return new;
end;
$$;

create trigger painel_entidade_revelacao after update on painel_entidades
  for each row execute function registra_revelacao();
create trigger painel_campo_revelacao after update on painel_campos
  for each row execute function registra_revelacao();
create trigger painel_relacionamento_revelacao after update on painel_relacionamentos
  for each row execute function registra_revelacao();
