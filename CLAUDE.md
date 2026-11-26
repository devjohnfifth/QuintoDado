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
   `data_nascimento`, nome civil, telefone ou respostas de linhas e véus em
   endpoint público, payload de RSC, sitemap ou JSON-LD. Só para inscrição com
   status `aprovado`.
   **RLS protege a linha, não a coluna.** Tabela lida publicamente entrega
   todas as colunas dela pra chave anônima — foi assim que nome civil e data de
   nascimento de 55 cadastros ficaram abertos até 15/11/2026. Dado sensível em
   tabela pública mora em **tabela satélite** com RLS própria (`mesa_contato`,
   `evento_pagamento`), não em coluna revogada: grant por coluna quebra as
   *computed columns* (`vagas_preenchidas`, `ingressos_vendidos` recebem a linha
   inteira e exigem SELECT na tabela toda). O que é do próprio usuário sai por
   função `security definer` (`minha_idade`, `meus_dados_pessoais`); o que é de
   terceiros, só por `service_role` com checagem de admin no próprio arquivo.
5. **Gating etário no servidor**, nunca só no front. O gating está em
   **entrar**, não em **ver**: mesa publicada aparece na listagem pra qualquer
   visitante, com o selo de classificação, e a policy `inscricao_cria` é que
   barra a candidatura de quem não tem idade. Esconder a mesa inteira tratava
   todo visitante deslogado como menor e deixava mesa +16 invisível até pro
   Google.
6. **Toda página pública renderiza no servidor** com metadata e Open Graph.
   SEO é prioridade alta neste projeto.
7. **Nenhum texto de interface embutido no JSX.** Tudo em arquivo de mensagem do
   `next-intl` desde o primeiro commit. O site é pt-BR na v1, mas o inglês vem —
   pt-BR fica na raiz sem prefixo, `/en` é reservado. Nunca use `/pt/...`.
   Fora de `/admin`, está migrado (varrido de novo em 24/11/2026 — na
   primeira passada escaparam o menu da conta, o sino de notificações, o
   formulário de perfil e mais quatro telas; não presuma que está limpo,
   confira). Exceção única: `src/app/global-error.tsx`, que substitui o
   layout raiz e não tem `IntlProvider` pra chamar. O painel admin é a dívida
   que sobrou, e tela nova dele nasce com `next-intl` mesmo assim.
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

**Multi-região:** o site atende uma lista fechada de cidades
(`src/lib/mesas/cidades.ts`), que cresce quando o João decidir. Cada cidade tem
página própria em `/presencial/[cidade]` — é o que responde "RPG presencial em
São Paulo" na busca, e por isso `/presencial/*` **não** pode voltar pro
`disallow` do robots. Quem é de outra região entra pela seção "Sua cidade não
está na lista?", que leva ao moderador regional no WhatsApp.

**Jogos digitais** são um braço futuro da comunidade (jogar junto + conteúdo).
Os textos já comportam a quarta frente; nada anunciado na tela ainda, e o
título da home não muda — é ele que ranqueia hoje.

Fora do escopo agora: pagamento integrado, suplementos pagos, split,
avaliações, blog, lembretes automáticos, cartão e recorrência. Se uma tarefa
pedir algo dessa lista, avise antes de implementar.

**Exceção:** mestre cadastrado (não só admin) *pode* criar mesa, **online ou
presencial**, em `/mesas/nova` (ver `docs/Especificacao-Completa_QuintoDado_v1.md`
§28, D11–D13). Nasce `aguardando_aprovacao` igual a qualquer mesa, valor é só
informativo (`cobranca_gerenciada_pelo_site = false`, nunca entra no fluxo de
Pix).

O mestre gerencia a própria mesa em `/mesas/candidaturas/[id]` (candidaturas),
`/mesas/editar/[id]` e pelo botão de cancelar em `/conta` — vale pras duas
modalidades.

**Mesa comissionada — a que o site cobra e repassa — continua só do admin**, em
qualquer modalidade. O que traz o Conflito A (§5.1) é o site processar o
dinheiro, não a modalidade da mesa: por isso a trava é a cobrança, não o
"presencial". As duas garantias são do banco, não do formulário — policy
`mesa_cria` (não-admin só insere com cobrança desligada e status
`aguardando_aprovacao`) e trigger `mesa_protege_campos` (não-admin não liga a
cobrança depois, não se autopublica, não transfere a mesa).

## Disciplina de qualidade (não repetir)

- **Nunca engula erro de escrita no banco.** Toda Server Action que faz
  insert/update/delete confere o `error` de cada chamada antes de retornar
  sucesso ou redirecionar — inclusive dentro de `Promise.all` com várias
  escritas. Uma escrita que falha e não é checada vira exatamente isto: o
  usuário salva, não vê erro nenhum, e a mudança simplesmente não aparece
  depois. (Aconteceu de verdade com `salvarExtras` em
  `admin/eventos/actions.ts` — a tabela nem existia ainda, por uma migração
  pendente, e a action retornou sucesso mesmo assim.)
- **Depois de escrever uma migration nova, nunca assuma que ela já rodou.**
  Antes de dizer "pronto, testa" pro usuário, confirma com um script
  service_role (`select` na tabela/coluna nova) que ela existe de verdade no
  banco dele. Se não existir, isso é a causa mais provável de qualquer "salvei
  e não aparece" — descarta essa hipótese primeiro, antes de procurar bug em
  outro lugar.
- Código que degrada bem na ausência de uma migração (não derruba a página)
  não é desculpa pra pular a checagem acima — degradar sem quebrar é rede de
  segurança, não substituto de confirmar que a escrita principal funcionou.

## Antes de encerrar uma tarefa

Funciona no mobile · RLS testado com usuário de outro papel · estados de
carregamento, erro e vazio · metadata e OG nas páginas públicas · textos em
pt-BR sem jargão · `pnpm build` e `pnpm test` passando · toda escrita nova
(insert/update/delete) tem o `error` checado, nenhuma ação "engolida" em
`Promise.all` · se a tarefa envolveu migration nova, confirmado via
service_role que ela já rodou antes de pedir pro usuário testar.
