# Quinto Dado

Site e plataforma do **Quinto Dado**, criador e mestre de RPG brasileiro. Reúne
três coisas num lugar só:

- **Vitrine e link-in-bio** — quem é o Mestre Quintão e por onde encontrá-lo.
- **Biblioteca de suplementos** — tabelas aleatórias interativas, mapas e
  homebrews, gratuitos.
- **Mesas** — candidatura a mesas online e presenciais, com painel de campanha
  pra quem entra.

Operação solo, público brasileiro, tudo em pt-BR.

> A fonte da verdade do produto é `docs/Especificacao-Completa_QuintoDado_v1.md`.
> As regras de trabalho no código estão em `CLAUDE.md`. Se o código divergir
> desses dois, são eles que estão certos.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15.5 (App Router, Turbopack) · React 19 |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 4 · shadcn/ui sobre Base UI |
| Banco, auth e imagens | Supabase (Postgres + Auth + Storage + RLS) |
| Arquivos de suplemento | Cloudflare R2 (S3 API, bucket privado) |
| Internacionalização | next-intl (`localePrefix: as-needed`) |
| Validação | Zod 4 |
| Testes | Vitest |
| Hospedagem | Vercel |
| Gerenciador | pnpm |

---

## Como rodar

Precisa de **Node 20+**, **pnpm** e um projeto Supabase.

```bash
pnpm install
cp .env.example .env.local   # preencha as chaves do Supabase
pnpm dev
```

O site sobe em `http://localhost:3000`.

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` | Build de produção — **roda regras de lint que o `pnpm lint` não roda** |
| `pnpm start` | Serve o build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (37 testes) |

> **`pnpm lint` limpo não substitui `pnpm build`.** Algumas regras do Next (como
> a que proíbe `<a>` pra rota interna) só rodam no build. Já aconteceu de o lint
> passar e o build quebrar.

> **Nunca rode `pnpm build` com o `pnpm dev` ativo.** Os dois disputam o `.next/`
> e o dev server quebra com `ENOENT ... build-manifest.json`. Encerre o dev
> antes, e lembre que matar só o processo da porta 3000 deixa filhos vivos
> segurando arquivos no Windows.

---

## Variáveis de ambiente

`.env.example` lista o alvo final do projeto. Nem tudo está em uso hoje:

| Variável | Em uso? | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | `metadataBase`, Open Graph, sitemap, JSON-LD |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Cliente Supabase (navegador e servidor) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Idem — **pública por definição**, vai no bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Só no servidor; ignora RLS |
| `R2_ACCOUNT_ID` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_BUCKET_NAME` | ✅ | Arquivos de suplemento |
| `RESEND_API_KEY` | ❌ | Declarada, **nenhum código a lê** |
| `ASAAS_API_KEY` · `ASAAS_WEBHOOK_TOKEN` | ❌ | Declaradas, **nenhum código as lê** (pagamento é Fase 2) |

O site **degrada sem derrubar** quando o Supabase não está configurado: as
páginas caem em estado vazio em vez de quebrar (`src/lib/supabase/is-configured.ts`).

---

## Estrutura de pastas

```
.
├── docs/            Especificação, modelo de dados, plano visual, textos
├── messages/        pt-BR.json — TODO texto de interface pública
├── public/          Estáticos servidos na raiz (icon-512.png)
├── scripts/         Utilitários locais (processamento de imagens de marca)
├── supabase/        Migrações versionadas
└── src/
    ├── app/         Rotas (App Router)
    ├── assets/      Imagens importadas pelo código
    ├── components/  Componentes de UI
    ├── i18n/        Configuração do next-intl
    ├── lib/         Regra de negócio, acesso a dados e utilitários
    └── middleware.ts
```

### `src/app`

```
app/
├── icon.png · apple-icon.png · favicon.ico   Ícones (ver "Favicon" abaixo)
├── manifest.ts · robots.ts · sitemap.ts      Metadados do site
├── globals.css                               Tokens de marca e utilitários
├── not-found.tsx                             404 de endereço sem rota nenhuma
├── global-error.tsx                          Último recurso de erro
├── api/
│   └── suplementos/baixar/[arquivoId]/       Download assinado do R2
└── [locale]/
    ├── layout.tsx       Shell: fontes, provider do next-intl, header, rodapé, halo
    ├── page.tsx         Home
    ├── mesas/           Catálogo, detalhe e painel de campanha
    ├── presencial/      Mesas presenciais por cidade, criação por mestres
    ├── eventos/         Eventos presenciais e venda de ingresso
    ├── suplementos/     Biblioteca e tabelas aleatórias interativas
    ├── conta/           Perfil, candidaturas, ingressos
    ├── entrar/ · completar-cadastro/ · redefinir-senha/
    ├── links/           Link-in-bio (sem header nem rodapé)
    ├── sobre/
    ├── termos/ · privacidade/ · reembolso/ · licenca-de-uso/
    └── admin/           Painel administrativo
```

### `src/lib`

| Pasta | Responsabilidade |
|---|---|
| `auth/` | `exigirAdmin` (guarda única) e `destinoSeguro` (valida redirect pós-login) |
| `supabase/` | Clientes: `client` (navegador), `server` (SSR), `service-role` (ignora RLS), `types` (tipos gerados) |
| `mesas/` | Rótulos, cidades atendidas, cores por sistema, horários, inscrições do usuário |
| `suplementos/` | Leitura pública, tipos de dado e rolagem de tabela |
| `painel/` | Acesso ao painel de campanha e leitura das entidades/sessões |
| `eventos/` | Rótulos de status de ingresso |
| `notificacoes/` | Disparo de notificações internas (tabela `notificacoes`) |
| `storage/` | `enviar-imagem` (Supabase Storage) e `r2` (arquivos privados) |

### `src/components`

- **`ui/`** — primitivos do shadcn/ui sobre Base UI. Não contêm regra de negócio.
- **`site/`** — componentes do produto. Os que carregam decisão de design:
  `mesa-card` (formato dossiê), `cadeiras-vagas`, `tabela-aleatoria`
  (o "teatro do dado"), `capa-pagina`, `paginacao`, `grade-adaptavel`,
  `bloco-fechamento`, `d20-marca-dagua`.

### `src/assets`

`brand/` (logo, foto do mestre, capivara aventureira, banner OG) ·
`eventos/` (fotos do UAIventura) · `presencial/` · `sistemas/` (logos dos
sistemas de RPG).

---

## Rotas

**Públicas** — `/` · `/mesas` · `/mesas/[slug]` · `/presencial` ·
`/eventos` · `/eventos/[slug]` · `/suplementos` · `/suplementos/[slug]` ·
`/sobre` · `/links` · legais (`/termos`, `/privacidade`, `/reembolso`,
`/licenca-de-uso`).

**Autenticadas** — `/conta` · `/mesas/[slug]/painel` (+ `/elenco`, `/sessoes`) ·
`/presencial/nova` e `/presencial/[id]` (mestres).

**Admin** (`papel = 'admin'`) — `/admin` e as seções de mesas, eventos,
suplementos e usuários. Bloqueadas no `robots.ts`.

**Redirects permanentes** (`next.config.ts`) — `/presencial-bh` e suas rotas
filhas respondem **308** para `/presencial`. O endereço antigo está indexado e
circulou no link-in-bio; um 404 jogaria fora o SEO e quebraria link de quem
salvou.

---

## Banco de dados (Supabase)

**44 tabelas** em `public`, criadas por **30 migrações versionadas** em
`supabase/migrations/`. Os blocos principais:

| Bloco | Tabelas |
|---|---|
| Identidade | `profiles`, `aceites_termos`, `consentimentos_responsavel` |
| Taxonomia | `sistemas`, `tags`, `mesa_tags`, `suplemento_tags` |
| Mesas | `mesas`, `inscricoes`, `inscricao_respostas`, `mesa_perguntas`, `mesa_sessoes` |
| Painel de campanha | `painel_entidades`, `painel_campos`, `painel_sessoes`, `painel_anotacoes`, `painel_rotulos`, `painel_relacionamentos`, `painel_revelacoes` |
| Eventos | `eventos`, `evento_ingressos`, `evento_ingresso_tipos`, `evento_mestres`, `evento_atracoes`, `evento_imagens`, `evento_apoiadores` |
| Suplementos | `suplementos`, `arquivos_suplemento`, `tabelas_aleatorias`, `tabela_itens`, `downloads`, `kits`, `kit_suplementos` |
| Pagamento (Fase 2) | `pagamentos`, `compras`, `repasses`, `faixas_comissao`, `webhook_eventos` |
| Operação | `notificacoes`, `audit_log`, `favoritos`, `depoimentos`, `links`, `eventos_analytics` |

### Regras que não se negociam

1. **RLS ligada em toda tabela, negando por padrão.** A garantia é o banco, não
   a tela. `service_role` existe só no servidor e só onde a permissão já foi
   checada no código.
2. **Dinheiro em centavos**, `integer`, com coluna de moeda. Nunca `float`.
3. **Gating etário no servidor.** `classificacoes_permitidas()` filtra por
   idade na própria policy — menor não alcança conteúdo acima da faixa nem por
   URL direta.
4. **Dados sensíveis nunca saem em endpoint público nem em payload de RSC:**
   `whatsapp_mestre`, `link_grupo_wpp`, `mensagem_boas_vindas`,
   `data_nascimento`, respostas de linhas e véus.

> A política de RLS é **por linha**, não por coluna, e os grants do projeto são
> de tabela inteira. Quando uma tabela tem coluna sensível, isso não basta: em
> `eventos`, `chave_pix` e `whatsapp_confirmacao` precisaram de `revoke` + grant
> por coluna para o papel `anon` (migração `20261027120000`). Vale checar o
> mesmo sempre que adicionar coluna sensível a uma tabela de leitura pública.

### Aplicando migrações

As migrações são aplicadas manualmente no SQL editor do Supabase.
**Nunca assuma que uma migração nova já rodou** — confirme com um script
`service_role` (ou pela chave anônima, quando o teste é de permissão) antes de
dizer que está pronto. Código que degrada bem sem a migração é rede de
segurança, não substituto da checagem.

---

## Armazenamento de arquivos

São **dois sistemas**, por motivos diferentes:

### Supabase Storage — imagens públicas

Quatro buckets públicos:

| Bucket | Conteúdo |
|---|---|
| `avatars` | Fotos de perfil |
| `mesa-banners` | Capas de mesa |
| `event-banners` | Capas de evento |
| `suplemento-capas` | Capas de suplemento |

Upload por `src/lib/storage/enviar-imagem.ts`, leitura por URL pública. O
domínio do projeto está liberado em `next.config.ts > images.remotePatterns`.

> **Os buckets não são criados por migração.** Nenhuma migração tem
> `insert into storage.buckets` — os quatro foram criados pela API/UI do
> Storage, e as migrações carregam só as *policies* de
> `storage.objects`. Então clonar o repositório e rodar as migrações num
> projeto Supabase novo **não** reproduz o armazenamento: os buckets precisam
> ser criados à mão primeiro, senão as policies apontam pra `bucket_id` que
> não existe e todo upload falha.

O caminho de cada arquivo começa com o id do usuário, porque as policies só
deixam escrever dentro do próprio diretório.

### Cloudflare R2 — arquivos de suplemento

Bucket **privado**, acessado pela API S3 (`@aws-sdk/client-s3`). Nada é servido
direto: `src/lib/storage/r2.ts` gera **URLs assinadas** de upload e download.

O download passa por `/api/suplementos/baixar/[arquivoId]`, que exige sessão,
registra em `downloads` e só então redireciona (303) pra URL assinada. É a RLS
que decide se o arquivo pode ser lido — a rota não é a barreira, é o caminho.

---

## Conexões externas

| Serviço | Papel | Como está ligado |
|---|---|---|
| **Vercel** | Hospedagem e deploy contínuo a partir do `master` | `@vercel/analytics` no layout. Sem `vercel.json` — tudo em `next.config.ts` |
| **Supabase** | Postgres, Auth, Storage, RLS | `NEXT_PUBLIC_SUPABASE_*` e `SUPABASE_SERVICE_ROLE_KEY` |
| **Cloudflare R2** | Arquivos de suplemento | `R2_*`, via S3 API |
| **GitHub** | `devjohnfifth/QuintoDado`, branch `master` | Origem do deploy |
| **Resend** | E-mail transacional | **Não integrado.** `RESEND_API_KEY` está no `.env.example` e nenhuma linha de `src/` a lê. Todo e-mail hoje sai pelo SMTP embutido do Supabase |
| **Asaas** | Pix | **Não integrado.** Fase 2 |

**Links externos de produto** ficam centralizados em `src/lib/site-links.ts`:
grupo do WhatsApp, Instagram, YouTube, e o perfil no **MesaQuest** — onde está
a maior parte das mesas comissionadas. Uma mesa pode apontar pra lá pelo campo
`link_externo`, e aí o card leva ao MesaQuest em vez de abrir candidatura aqui.

---

## Internacionalização

`next-intl` com `localePrefix: "as-needed"` e `defaultLocale: "pt-BR"`. Hoje só
pt-BR está no array de locales, então **não existe prefixo na URL**. O inglês
está reservado: quando entrar, vira `/en/...` e o pt-BR continua na raiz.
`/pt/...` nunca existe.

**Nenhum texto de interface pública fica no JSX.** Tudo em
`messages/pt-BR.json` desde o primeiro commit. O admin é a exceção aceita — é
tela interna de uma pessoa só.

> O pacote de mensagens inteiro é serializado em toda página pro provider do
> cliente. São strings públicas, então não é problema de segurança — mas
> explica por que um `grep` no HTML encontra textos de telas que não estão
> sendo renderizadas.

---

## Convenções

- **Português no domínio, inglês no código.** Tabelas, colunas e rotas de
  domínio em pt-BR (`mesas`, `inscricoes`, `/suplementos`); tipos e utilitários
  em inglês.
- **Server Components por padrão.** `"use client"` só onde há interação de
  verdade.
- **Toda mutação passa por Server Action ou Route Handler** que revalida a
  regra no servidor. Formulário valida pra dar mensagem boa, não pra garantir.
- **Zod em toda entrada externa** — formulário e webhook.
- **Mobile-first, tema escuro por padrão.**
- **Toda escrita confere o `error`.** Inclusive dentro de `Promise.all`: uma
  escrita que falha sem checagem vira "salvei e não apareceu".
- **Nada que o visitante precisa ver depende de animação rodar.** Já quebrou
  duas vezes: `animation-fill-mode: backwards` com atraso deixou o `/links`
  invisível, e um contador por `requestAnimationFrame` travou em zero com a aba
  em segundo plano. Entrada ligada à rolagem (`animation-timeline: view()`)
  nasce visível; o resto precisa de rede de segurança.

### Identidade visual

```
--qd-fundo #0B0B14 · --qd-primaria #4F7DF3 · --qd-secundaria #9B5CF6
--qd-gradiente linear-gradient(135deg, #4F7DF3, #A855F7)
--qd-texto #F5F5FA · --qd-texto-suave #A0A0B8
```

Mais as semânticas `--qd-sucesso`, `--qd-alerta` e `--qd-erro`. **Não há cor de
acento fora dessa paleta** — a hierarquia sai do azul, do roxo e do gradiente.
Um âmbar foi introduzido e removido depois, por puxar o site pra fora da
identidade.

Utilitários próprios em `globals.css`: escala tipográfica fluida
(`titulo-hero`, `titulo-pagina`, `titulo-secao`, `titulo-bloco`, `rotulo-caps`),
superfícies (`painel`, `painel-alto`, `borda-luz`), textura (`textura-grao`,
`textura-hex`), marca (`bg-marca`, `text-marca`, `halo-marca`, `brilho-marca`)
e movimento ligado à rolagem (`cascata`, `parallax-heroi`, `revelar`,
`barra-encolhe`).

### Favicon

`icon.png` é 192×192 (múltiplo de 48, como o Google pede) com a arte a **86% do
raio** do círculo inscrito. O Google recorta o favicon num círculo: a versão
anterior chegava a 101% do raio e tinha a moldura do d20 cortada na busca.
`favicon.ico` tem quadros 16/32/48 **em RGBA** — o Next recusa o `.ico` se
vierem em RGB.

---

## Estado do projeto

**Fase Alfa.** Está no ar: home, catálogo de mesas com candidatura, presencial
em cinco cidades, eventos com venda de ingresso por Pix manual, biblioteca de
suplementos com tabelas interativas, painel de campanha, área da conta, admin e
páginas legais.

**Fora do escopo atual:** pagamento integrado (Asaas), suplementos pagos,
split de pagamento, avaliações, blog, lembretes automáticos, cartão e
recorrência.

### Dívidas conhecidas

- **SMTP próprio no Supabase.** O serviço embutido tem limite de taxa baixo e
  não serve pra produção. Enquanto não entrar, o e-mail de confirmação de
  cadastro é o ponto frágil do fluxo de entrada.
- **Tags de mesa** (`tema` / `estilo` / `seguranca`): tabelas e RLS prontas,
  **zero linhas** e nenhum seletor no admin.
- **Paginação mista.** As oito listas paginam, mas só três no banco, com
  `.range()` (`/eventos`, `/suplementos`, `/admin/eventos/[id]`). As outras
  cinco buscam tudo e cortam em memória com `fatiar()`, porque os filtros
  precisam do conjunto inteiro pra contar quanta coisa existe em cada opção.
  Funciona bem no volume atual; quando o acervo crescer, vira `.range()` mais
  uma consulta separada só pras contagens.
- **Listas sem paginação nenhuma:** `/admin/usuarios` (cresce a cada cadastro)
  e `/conta`. A de usuários é a que estoura primeiro.
- **Aviso de hidratação** no gatilho do menu móvel: o `base-ui` gera ids
  diferentes entre servidor e cliente.
- `src/lib/site-links.ts` tem um `TODO` pra virar tabela `links` editável pelo
  admin.
