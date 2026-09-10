-- Nada impedia o mestre de se candidatar à própria mesa (a Server Action
-- não checava isso — corrigido junto no código). Mas mesmo com o código
-- bloqueando daqui pra frente, essas duas "computed columns" continuam
-- somando qualquer inscrição aprovada por id de mesa, sem saber quem é o
-- mestre — então blindamos aqui também: o mestre nunca conta como vaga
-- preenchida nem aparece na lista de "quem confirmou presença", mesmo que
-- uma inscrição dele exista (de antes desta correção, por exemplo).
create or replace function vagas_preenchidas(m mesas)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from inscricoes
  where mesa_id = m.id and status = 'aprovado' and usuario_id != m.mestre_id;
$$;

create or replace function jogadores_aprovados(m mesas)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('nome', p.nome_exibicao, 'avatar_url', p.avatar_url)
      order by i.aprovado_em asc
    ),
    '[]'::jsonb
  )
  from inscricoes i
  join profiles p on p.id = i.usuario_id
  where i.mesa_id = m.id and i.status = 'aprovado' and i.usuario_id != m.mestre_id;
$$;
