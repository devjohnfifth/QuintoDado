-- Três coisas que andam juntas: fechar duas colunas pessoais que estavam
-- abertas, fechar os campos sensíveis da mesa, e só então deixar mesa acima
-- da faixa etária aparecer na listagem pública.
--
-- Mesmo problema que o 20261027120000 resolveu em `eventos`: a policy é por
-- LINHA e os grants do projeto são de TABELA INTEIRA
-- (20260907225927_grants_papeis_supabase.sql). `profiles` precisa ser legível
-- publicamente (nome de exibição e avatar aparecem em card de mesa, elenco e
-- página de evento), e isso arrastava junto tudo o que está na tabela:
--
--   GET /rest/v1/profiles?select=username,data_nascimento,nome_completo
--
-- devolvia, com a chave anônima — que vai no bundle do navegador —, a data de
-- nascimento e o nome civil dos 55 cadastros. Aqui isso vazava de verdade, não
-- era risco futuro. A regra 4 do CLAUDE.md proíbe `data_nascimento` em
-- endpoint público, e nome civil e telefone têm o mesmo peso sob a LGPD.
--
-- Diferente de `eventos`, aqui não basta revogar de `anon`: qualquer pessoa
-- cria uma conta e vira `authenticated`. As três colunas saem dos dois papéis
-- e passam a ser servidas só de dois jeitos — pelo próprio dono, via as
-- funções `minha_idade()` / `meus_dados_pessoais()` abaixo, ou pelo servidor
-- com `service_role` depois de conferir que quem pede é admin.

-- ---------------------------------------------------------------------------
-- 1. O gating etário continua funcionando depois do revoke.
-- ---------------------------------------------------------------------------
-- `idade_de` já era security definer (roda como dono), então as policies que
-- dependem dela não se importam com o revoke. Só faltava fixar o search_path,
-- que é o cuidado padrão de toda função security definer.
create or replace function public.idade_de(uid uuid) returns int
language sql stable security definer set search_path = public as $$
  select extract(year from age(current_date, data_nascimento))::int
  from profiles where id = uid;
$$;

-- ---------------------------------------------------------------------------
-- 2. O que a pessoa precisa saber sobre ela mesma, sem abrir a coluna.
-- ---------------------------------------------------------------------------
-- Usada pela página da mesa pra decidir se mostra "sua conta não tem a idade
-- mínima". Devolve só um número, e só do próprio usuário.
create or replace function public.minha_idade() returns int
language sql stable security definer set search_path = public as $$
  select extract(year from age(current_date, data_nascimento))::int
  from profiles where id = auth.uid();
$$;

-- Usada por /conta pra preencher o formulário de perfil. `auth.uid()` fecha o
-- escopo: não existe parâmetro pra pedir o dado de outra pessoa.
create or replace function public.meus_dados_pessoais()
returns table (nome_completo text, telefone text, data_nascimento date)
language sql stable security definer set search_path = public as $$
  select p.nome_completo, p.telefone, p.data_nascimento
  from profiles p where p.id = auth.uid();
$$;

revoke execute on function public.minha_idade() from anon;
revoke execute on function public.meus_dados_pessoais() from anon;
grant execute on function public.minha_idade() to authenticated;
grant execute on function public.meus_dados_pessoais() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Colunas pessoais saem do alcance das chaves públicas.
-- ---------------------------------------------------------------------------
revoke select on public.profiles from anon, authenticated;

grant select (
  id,
  username,
  nome_exibicao,
  avatar_url,
  bio,
  papel,
  perfil_publico,
  sistemas_favoritos,
  criado_em,
  -- Quem pediu pra virar mestre: o admin vê pelo service_role, mas a própria
  -- pessoa precisa ver o estado do pedido na tela de criar mesa.
  mestre_solicitado_em
) on public.profiles to anon, authenticated;

comment on column public.profiles.data_nascimento is
  'Dado pessoal: nunca legível por anon/authenticated. Sai por minha_idade() ou service_role.';
comment on column public.profiles.nome_completo is
  'Nome civil: nunca legível por anon/authenticated. Sai por meus_dados_pessoais() ou service_role.';
comment on column public.profiles.telefone is
  'Telefone: nunca legível por anon/authenticated. Mesmo caminho do nome_completo.';

-- ---------------------------------------------------------------------------
-- 4. Campos sensíveis da mesa, que a regra 4 cita por nome.
-- ---------------------------------------------------------------------------
-- Estavam abertos desde o começo. Hoje estão nulos em todas as mesas, então
-- nada vazou ainda — mas vazaria no dia em que o primeiro mestre preenchesse
-- o WhatsApp dele. Nenhum código do site lê estas três colunas hoje (elas são
-- pra quando a entrega ao jogador aprovado existir), então fechar não quebra
-- nada e deixa a trava pronta antes do recurso.
revoke select on public.mesas from anon, authenticated;

grant select (
  id,
  slug,
  mestre_id,
  titulo,
  banner_url,
  sinopse,
  sistema_id,
  sistema_outro,
  tipo,
  modalidade,
  cidade_uf,
  plataforma_vtt,
  plataforma_voz,
  classificacao,
  nivel_experiencia,
  vagas_total,
  min_jogadores,
  preco_centavos,
  moeda,
  modelo_cobranca,
  cobranca_gerenciada_pelo_site,
  frequencia,
  qtd_sessoes,
  data_inicio,
  horario_inicio,
  horario_fim,
  fuso,
  idioma,
  status,
  aprovada_por,
  aprovada_em,
  criado_em,
  cancelado_em,
  atualizado_em,
  evento_id,
  link_externo
) on public.mesas to anon, authenticated;

comment on column public.mesas.whatsapp_mestre is
  'Contato do mestre: nunca legível por anon/authenticated. Só no servidor, após conferir inscrição aprovada.';
comment on column public.mesas.link_grupo_wpp is
  'Link do grupo da mesa: mesmo caminho do whatsapp_mestre.';
comment on column public.mesas.mensagem_boas_vindas is
  'Só para quem foi aprovado na mesa: mesmo caminho do whatsapp_mestre.';

-- ---------------------------------------------------------------------------
-- 5. Mesa acima da faixa etária volta a aparecer na listagem.
-- ---------------------------------------------------------------------------
-- Antes, `mesa_leitura` escondia a linha inteira de quem não tinha idade — e
-- `classificacoes_permitidas()` trata visitante deslogado como menor, porque
-- não há como saber a idade de quem não tem conta. O efeito prático era que
-- uma mesa +16 publicada não existia pra ninguém de fora: nem na lista, nem
-- pela URL direta, nem pro Google. Mesa sem audiência não enche.
--
-- Agora a mesa publicada aparece pra todo mundo, com o selo de classificação
-- visível no card, e o gating passa a morar onde ele de fato importa: a
-- policy `inscricao_cria` (20260908000000) continua exigindo
-- `classificacao = any (classificacoes_permitidas())` pra inserir candidatura,
-- então menor vê que a mesa existe e não consegue entrar nela. É o mesmo
-- desenho de loja de jogo e de serviço de streaming.
--
-- O que NÃO muda: rascunho e aguardando_aprovacao continuam invisíveis, e os
-- campos sensíveis do bloco 4 continuam fechados pra qualquer um.
drop policy if exists mesa_leitura on mesas;
create policy mesa_leitura on mesas for select using (
  eh_admin() or mestre_id = auth.uid()
  or status in ('publicada','confirmada','em_andamento')
);
