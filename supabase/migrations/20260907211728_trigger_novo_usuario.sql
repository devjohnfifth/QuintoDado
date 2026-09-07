-- =====================================================================
-- Fluxo de cadastro: cria o profile (+ registra aceite dos termos)
-- automaticamente quando um usuário termina o cadastro no Supabase Auth.
--
-- Cadastro por e-mail/senha (nosso formulário, ver
-- src/app/[locale]/entrar/actions.ts > criarConta()) já manda username,
-- nome_exibicao e data_nascimento em auth.users.raw_user_meta_data antes
-- de chamar signUp() -> o profile nasce completo na hora, pelo trigger.
--
-- Login social (Google/Discord) NÃO tem como mandar esses campos: o
-- redirect pro provedor não passa por um formulário nosso. Nesse caso o
-- trigger não faz nada (sem profile ainda) e o usuário é levado pra
-- /completar-cadastro, que insere o profile direto (via RLS, não trigger)
-- depois de coletar o que falta — sobretudo data_nascimento, que o gating
-- etário depende. De propósito SEM valor default pra data de nascimento:
-- é melhor a Home de "cadastro incompleto" travar o usuário do que criar
-- silenciosamente um perfil com idade inventada.
-- =====================================================================

create or replace function public.lidar_com_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  data_nasc date;
begin
  data_nasc := (new.raw_user_meta_data ->> 'data_nascimento')::date;

  if data_nasc is not null then
    insert into public.profiles (id, username, nome_exibicao, data_nascimento)
    values (
      new.id,
      new.raw_user_meta_data ->> 'username',
      coalesce(
        new.raw_user_meta_data ->> 'nome_exibicao',
        new.raw_user_meta_data ->> 'full_name',
        'Novo usuário'
      ),
      data_nasc
    );

    insert into public.aceites_termos (usuario_id, documento, versao)
    values (new.id, 'termos', coalesce(new.raw_user_meta_data ->> 'versao_termos', 'v1'));
  end if;

  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.lidar_com_novo_usuario();

-- ---------- RLS que faltava pro fluxo /completar-cadastro --------------
-- (login social cria o profile direto do cliente autenticado, não pelo
-- trigger acima, então precisa de policy de insert nas duas tabelas)

create policy perfil_cria_proprio on profiles for insert
  with check (id = auth.uid());

create policy aceite_cria_proprio on aceites_termos for insert
  with check (usuario_id = auth.uid());
