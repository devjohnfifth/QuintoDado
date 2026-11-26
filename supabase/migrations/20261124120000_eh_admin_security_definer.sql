-- =====================================================================
-- `eh_admin()` vira `security definer`.
--
-- Ela nasceu `language sql stable`, sem `security definer`, e lê `profiles`.
-- Só que ela também é usada DENTRO da policy de leitura de `profiles`:
--
--   perfil_leitura_publica: using (perfil_publico or id = auth.uid() or eh_admin())
--
-- Enquanto todo mundo tinha `perfil_publico = true`, o `or` resolvia no
-- primeiro termo e a função nunca era chamada por um visitante. No dia em
-- que alguém fechasse o perfil, os dois primeiros termos viravam falso, o
-- Postgres chamava `eh_admin()`, que faz `select from profiles`, que dispara
-- a mesma policy, que chama `eh_admin()` de novo — até o banco desistir com
-- `stack depth limit exceeded`.
--
-- E não quebrava só o perfil: QUALQUER consulta que faz join em `profiles`
-- cai junto. A listagem pública de `/mesas` faz esse join pra mostrar o
-- "mestrada por", então um único perfil fechado derrubaria a vitrine
-- inteira do site pra visitante deslogado. Confirmado no banco antes desta
-- migration: `select ... from mesas join profiles` com a chave anônima
-- retornava `stack depth limit exceeded`.
--
-- Isto estava armado desde a migration inicial (06/09/2026) e nunca disparou
-- porque não existia tela pra desligar `perfil_publico`. A tela de perfil
-- público é que acabou de criar essa tela — por isso a correção vem junto.
--
-- `security definer` faz a função rodar com os privilégios de quem a criou,
-- ignorando a RLS de `profiles` lá dentro. É o mesmo que
-- `eh_mestre_da_mesa()` e `eh_membro_da_mesa()` já fazem, e o comentário
-- delas no painel diz "pelo mesmo motivo de eh_admin()" — motivo certo,
-- função que nunca tinha recebido o tratamento.
--
-- `set search_path = public` junto, porque função `security definer` sem
-- search_path fixo aceita ser enganada por um schema no caminho de quem
-- chama.
-- =====================================================================

create or replace function eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and papel = 'admin');
$$;

comment on function eh_admin() is
  'Quem é admin. security definer de propósito: é usada na policy de leitura de profiles e, sem isso, a consulta recursa até estourar a pilha.';
