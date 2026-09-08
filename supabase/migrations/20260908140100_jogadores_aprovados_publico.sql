-- Mesmo raciocínio de `vagas_preenchidas`: o card público de mesa vai
-- mostrar os avatares de quem já foi aprovado. `inscricoes` continua
-- fechado por RLS (correto), então isso expõe só o que o card precisa
-- (nome de exibição + avatar — já públicos via profiles de qualquer forma)
-- como computed column, sem abrir as linhas de inscricoes em si.
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
  where i.mesa_id = m.id and i.status = 'aprovado';
$$;

grant execute on function jogadores_aprovados(mesas) to anon, authenticated, service_role;
