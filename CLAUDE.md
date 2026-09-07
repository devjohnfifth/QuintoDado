# CLAUDE.md — Quinto Dado

> Leia também `docs/Especificacao-Completa_QuintoDado_v1.md` (documento-mãe,
> fonte da verdade — se o código divergir dele, o documento é que está
> certo) e `docs/Modelo-de-Dados_QuintoDado_v1.sql` antes de qualquer tarefa.

## O que é

Site pessoal e plataforma do **Quinto Dado**, criador e mestre de RPG brasileiro.
Três módulos: vitrine/links, biblioteca de suplementos de RPG (freemium) e venda
de mesas comissionadas. Operação solo. Público brasileiro. Tudo em pt-BR.

Objetivo do produto nesta fase: **construir audiência**. Em qualquer dúvida de
escopo, prefira o que aumenta visitas, cadastros e entrada no grupo de WhatsApp.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase
(Postgres + Auth + RLS) · Cloudflare R2 (arquivos) · Asaas (Pix) · Resend (e-mail).

## Regras invioláveis

1. **Dinheiro em centavos**, `integer`, com coluna de moeda. Nunca `float`.
2. **RLS ligado em toda tabela.** Negar por padrão. `service_role` só no servidor.
3. **Webhook é a fonte da verdade do pagamento.** Nunca confie no redirect de
   sucesso. Valide assinatura e trate reentrega como no-op.
4. **Nunca exponha** `whatsapp_mestre`, `link_grupo_wpp`, `mensagem_boas_vindas`,
   `data_nascimento` ou respostas de linhas e véus em endpoint público, payload
   de RSC, sitemap ou JSON-LD. Só para inscrição com status `aprovado`.
5. **Gating etário no servidor**, nunca só no front. Menor não pode alcançar
   conteúdo acima da faixa nem por URL direta.
6. **Toda página pública renderiza no servidor** com metadata e Open Graph.
   SEO é prioridade alta neste projeto.
7. **Nenhum texto de interface embutido no JSX.** Tudo em arquivo de mensagem do
   `next-intl` desde o primeiro commit. O site é pt-BR na v1, mas o inglês vem —
   pt-BR fica na raiz sem prefixo, `/en` é reservado. Nunca use `/pt/...`.
8. **Mobile-first.** Tema escuro é o padrão.
9. Regra que mexe em dinheiro ou em reembolso **exige teste automatizado**.

## Identidade visual

```
--fundo #0B0B14 · --primaria #4F7DF3 · --secundaria #9B5CF6
--gradiente linear-gradient(135deg,#4F7DF3,#A855F7)
--texto #F5F5FA · --texto-suave #A0A0B8
```
Logo: monograma "5D" branco sobre gradiente azul→roxo, com padrão de d20.
Use o d20 como textura discreta de fundo, nunca competindo com o conteúdo.

## Convenções

- Nomes de tabela, coluna e rota de domínio em **português** (`mesas`,
  `inscricoes`, `/suplementos`). Código, tipos e utilitários em inglês.
- Server Components por padrão; `"use client"` só quando houver interação.
- Toda mutação passa por Server Action ou Route Handler que revalida a regra
  de negócio no servidor. Nunca confie em validação de formulário.
- Zod para validar toda entrada externa (formulário e webhook).
- Migrações versionadas em `supabase/migrations/`. Nada de alterar schema pela UI.
- `next-intl` com `localePrefix: 'as-needed'` e `defaultLocale: 'pt-BR'`.
- Segredos só em variáveis de ambiente. Nunca commitar `.env`.

## Estado do projeto

Fase atual: **Alfa (semana 1)**. Escopo: home, `/links`, `/sobre`, auth com
papéis e gating etário, catálogo de suplementos gratuitos, uma tabela aleatória
interativa, `/mesas` com candidatura **sem pagamento**, admin mínimo, SEO base
e páginas legais.

Fora do escopo agora: pagamento integrado, suplementos pagos, split,
avaliações, blog, lembretes automáticos, cartão e recorrência. Se uma tarefa
pedir algo dessa lista, avise antes de implementar.

**Exceção:** mestre cadastrado (não só admin) *pode* criar mesa — mas só a
presencial de `/presencial-bh` (ver `docs/Especificacao-Completa_QuintoDado_v1.md`
§28, D11–D13). Nasce `aguardando_aprovacao` igual a qualquer mesa, valor é só
informativo (`cobranca_gerenciada_pelo_site = false`, nunca entra no fluxo de
Pix). Mesa online comissionada continua só do admin.

## Antes de encerrar uma tarefa

Funciona no mobile · RLS testado com usuário de outro papel · estados de
carregamento, erro e vazio · metadata e OG nas páginas públicas · textos em
pt-BR sem jargão · `pnpm build` e `pnpm test` passando.
