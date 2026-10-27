-- Fecha a leitura anônima das colunas de pagamento do evento.
--
-- A política `evento_leitura` é por LINHA (`status = 'publicado' or eh_admin()`)
-- e os grants do projeto são de tabela inteira (ver
-- 20260907225927_grants_papeis_supabase.sql: `grant all on all tables ... to
-- anon`). Juntando as duas coisas, qualquer visitante com a chave anônima —
-- que é pública por definição, vai no bundle do navegador — conseguia ler
-- `chave_pix` e `whatsapp_confirmacao` de um evento publicado direto pelo
-- PostgREST:
--
--   GET /rest/v1/eventos?select=chave_pix,whatsapp_confirmacao
--
-- Hoje não vaza porque não há evento publicado, mas vazaria no próximo.
-- A regra 4 do CLAUDE.md trata telefone de contato como dado que não pode
-- sair em endpoint público, e a chave Pix tem o mesmo peso.
--
-- `authenticated` continua lendo: quem tem conta precisa da chave pra pagar,
-- e já vê os dois no diálogo de compra.

revoke select on public.eventos from anon;

grant select (
  id,
  slug,
  titulo,
  subtitulo,
  descricao,
  banner_url,
  cidade_uf,
  local,
  data_inicio,
  data_fim,
  horario_inicio,
  horario_fim,
  capacidade_maxima,
  vendas_abertas,
  status,
  criado_em,
  -- O sitemap roda sem sessão (ou seja, como anon) e lê `atualizado_em`.
  atualizado_em
) on public.eventos to anon;

comment on column public.eventos.chave_pix is
  'Dado de pagamento: nunca legível por anon. Sai só pela dadosPagamentoAction, com sessão.';
comment on column public.eventos.whatsapp_confirmacao is
  'Telefone de contato: nunca legível por anon. Mesmo caminho da chave_pix.';
