# Quinto Dado — Documento de Projeto (v1)

> Documento-fonte para desenvolvimento assistido por Claude Code.
> Data: 06/09/2026 · Status: aprovado para início do Alfa
> Arquivos irmãos: `Modelo-de-Dados_QuintoDado_v1.sql`, `CLAUDE_QuintoDado_v1.md`, `Textos_QuintoDado_v1.md`

---

## 1. Visão

Site pessoal e plataforma da marca **Quinto Dado**, criador de conteúdo e mestre de RPG. Três pilares:

1. **Vitrine** — hub de links, apresentação do perfil, prova social.
2. **Suplementos** — biblioteca de conteúdo autoral de RPG, freemium, com peças interativas jogáveis no navegador.
3. **Mesas** — venda e gestão de mesas comissionadas, hoje só do admin, futuramente de mestres convidados.

**Objetivo primário dos primeiros 6 meses: construir audiência.** Toda decisão de escopo é resolvida a favor de: mais visitantes → mais cadastros → mais gente no grupo. Receita é objetivo secundário nesta fase.

**Relação com o MesaQuest:** convivência, não substituição. Algumas mesas continuam lá. O site próprio é o destino de quem já conhece a marca.

### 1.1 Escala atual (dimensiona a arquitetura)

| Métrica | Hoje |
|---|---|
| Comunidade WhatsApp | ~20 pessoas |
| Mesas pagas/mês | ~8 |
| Publicação de suplementos | 1/semana |
| Equipe | 1 pessoa (solo, perfil técnico de TI) |
| Preço praticado | R$ 35 a R$ 40 por sessão |
| Formato predominante | One-shot online (Discord + Foundry VTT) |
| Sistemas | Ordem Paranormal/OP2, Tormenta 20, Vaesen, Fabula Ultima, Daggerheart, Sacramento |
| Reputação no MesaQuest | 5.0 · 7 recomendações |
| Idiomas | Português e inglês |

Isso significa: **nada de arquitetura distribuída, filas, microserviços ou multi-tenant.** Um Next.js monolítico com Postgres aguenta 100x esse volume. A escalabilidade exigida está no *modelo de dados* e nas *regras de negócio*, não na infra.

---

## 2. Três conflitos encontrados nas respostas (e como resolvi)

### 2.1 Retenção de dinheiro de terceiros × pessoa física — **DECIDIDO**

O conflito original: você disse (7.1) que outros mestres recebem por Pix, mas também (7.2, 7.3) que o site cobra comissão progressiva e retém o valor até uma semana após a sessão. Reter para depois repassar significa que o dinheiro entra na sua conta e sai para outra pessoa — isso te coloca no papel de intermediador de pagamentos, com implicação fiscal (o valor cheio pode ser lido como sua receita) e risco de responsabilização solidária pelo serviço do outro mestre (CDC, art. 7º, parágrafo único).

**Decisão final, após revisão:**

A retenção **não é eliminada**, porque ela é o que financia os estornos. Se o mestre recebe no ato e o jogador cancela com 40h de antecedência tendo direito a 50%, o reembolso sai do bolso da plataforma. Sem retenção, você vira o seguro da operação.

O que muda é o **prazo** e o **custodiante**:

- **Prazo:** liberação **24h após o fim da sessão**, uniforme para todos (antes: D+7 para terceiros, fim da sessão para o admin). Depois que a sessão acontece não resta cenário de reembolso previsto em política; sete dias só criam atrito com o mestre sem proteger ninguém.
- **Custodiante:** o **split nativo do gateway**, com data de liberação agendada. O dinheiro nunca transita pela sua conta pessoal. Nada de receber tudo e transferir por Pix depois.
- **Alfa e v1 só operam mesas do admin** — dinheiro seu, sem terceiro no meio, risco zero. A questão só se torna real na Fase 2.

⚠️ **Validar com o gateway antes da Fase 2:** confirme com o Asaas (ou Mercado Pago) se o split de Pix permite **agendar a data de liberação** do valor do recebedor secundário. Se não permitir, as alternativas são: (a) emitir a cobrança apenas nos dias próximos à sessão, encurtando a janela de reembolso; ou (b) split imediato com cláusula contratual de que o estorno é descontado de repasses futuros do mestre — pior para operação solo. Não implemente a Fase 2 sem essa resposta.

### 2.2 Faixas de comissão com buracos

Você definiu: mínimo R$5 (só taxa de pagamento) · 10–20 = 8% · 20–50 = 10% · >50 = 15%. Faltou a faixa **R$5–9,99** e os limites são ambíguos (R$20 é 8% ou 10%?).

**Decidido** (tabela de configuração no banco, editável sem deploy):

| Faixa | Comissão da plataforma |
|---|---|
| R$ 5,00 – R$ 9,99 | 0% (só a taxa do gateway) — **confirmado** |
| R$ 10,00 – R$ 19,99 | 8% |
| R$ 20,00 – R$ 49,99 | 10% |
| R$ 50,00 ou mais | 15% |

Mesas do admin: comissão 0%, liberação imediata após a sessão (sua regra do 7.3).

### 2.3 Idade mínima de 14 anos × mesa paga

Você quer 14 anos como mínimo e gating por faixa etária no conteúdo — isso está resolvido. O problema é outro: pelo Código Civil, menor de 16 é **absolutamente incapaz** de contratar (art. 3º) e entre 16 e 18 é **relativamente incapaz** (art. 4º). Um jogador de 14 anos não pode, sozinho, contratar uma mesa paga. E pela LGPD (art. 14), tratamento de dados de criança/adolescente exige cuidado reforçado e, na prática, consentimento do responsável.

**Decidido:** cadastro liberado a partir de 14 anos para conteúdo gratuito e navegação. Para **inscrição em mesa paga por menor de 18**, o fluxo exige um **Termo de Autorização do Responsável** — nome, CPF e e-mail do responsável, com confirmação por link enviado ao e-mail dele antes da vaga ser confirmada. É uma tela a mais, e te protege inteiramente. Está modelado em `consentimentos_responsavel`.

---

## 3. Personas

| Persona | Objetivo | Entra por |
|---|---|---|
| **Seguidor curioso** | Ver quem é o Quinto Dado, entrar no grupo | Instagram/TikTok → `/links` |
| **Mestre buscando material** | Baixar tabela/mapa para usar hoje | Google → página de suplemento |
| **Jogador procurando mesa** | Sentar numa mesa paga | Home ou Instagram → `/mesas` |
| **Admin (você)** | Publicar conteúdo e gerir mesas em minutos | `/admin` |
| **Mestre convidado (Fase 2)** | Criar mesa e receber | Convite manual |

O **mestre buscando material** é a persona de aquisição mais importante: é a única que chega pelo Google sem te conhecer. Por isso SEO e conteúdo gratuito são o motor de audiência.

---

## 4. Mapa de páginas

```
/                        Home
/links                   Hub de links (bio do Instagram)
/sobre                   Quem é o Quinto Dado
/suplementos             Catálogo + filtros
/suplementos/[slug]      Detalhe: preview, download, tabela interativa
/kits/[slug]             Kit temático (conjunto de suplementos)
/mesas                   Vitrine de mesas + filtros
/mesas/[slug]            Detalhe da mesa + candidatura
/mestres                 [Fase 2] Listagem de mestres
/u/[username]            Perfil público
/conta                   Minha área: inscrições, downloads, favoritos, dados
/conta/inscricoes/[id]   Status da inscrição, pagamento, briefing pós-aprovação
/apoie                   Doação voluntária (Pix)
/blog                    [Fase 2]
/termos  /privacidade  /reembolso  /licenca-de-uso
/admin/*                 Painel

sitemap.xml · robots.txt · rss.xml
```

---

## 5. Requisitos por módulo

### 5.1 Home

- **Bloco 1 — herói:** logo, tagline, dois CTAs: *Entrar na comunidade* (WhatsApp) e *Ver mesas abertas*.
- **Bloco 2 — links rápidos:** WhatsApp do grupo, Instagram, TikTok, YouTube, MesaQuest. Mesmos dados de `/links`, fonte única no banco (tabela `links`), ordenáveis pelo admin.
- **Bloco 3 — apresentação curta** com link para `/sobre`.
- **Bloco 4 — mesas abertas** (até 3 cards) — some se não houver nenhuma.
- **Bloco 5 — últimos suplementos** (até 6).
- **Bloco 6 — prova social:** carrossel de depoimentos + embed de vídeos (YouTube/TikTok). Tabela `depoimentos`, com campo de origem ("MesaQuest", "WhatsApp", "aluno").
- **Bloco 7 — rodapé** com links legais.

Sem newsletter (decisão 2.8). O grupo de WhatsApp faz esse papel.

> Textos prontos para home, `/sobre` e `/links` estão em `Textos_QuintoDado_v1.md`, escritos a partir do perfil real do MesaQuest. O Instagram (@quintodado) está protegido por login e não pôde ser lido — se houver bio ou destaques relevantes lá, me mande.

### 5.2 Contas e permissões

- Login: **Google, Discord e e-mail+senha** (Supabase Auth).
- Cadastro pede: nome de exibição, username (slug), data de nascimento (obrigatória — dirige o gating etário), aceite dos termos.
- Papéis: `visitante` (sem conta) · `usuario` · `mestre` · `admin`. Coluna `role` em `profiles`, checada por RLS.
- **Candidatura a mestre existe no código mas nasce desligada** por feature flag (`FEATURE_CANDIDATURA_MESTRE=false`). No Alfa, promoção a mestre é manual pelo admin.
- Perfil público (`/u/[username]`): avatar, bio, sistemas favoritos, mesas que mestra. Usuário escolhe se o perfil é público ou privado.
- Conta destrava: baixar gratuitos, favoritar, se candidatar a mesas.

**Gating etário.** Cada mesa e cada suplemento tem `classificacao` ∈ {`livre`, `14`, `16`, `18`}. Um usuário de 14 anos não vê (nem em listagem, nem por URL direta, nem no sitemap) conteúdo `16` ou `18`. Filtro aplicado no servidor e reforçado por RLS — nunca só no front. Visitante não logado vê apenas `livre` e `14`.

### 5.3 Suplementos

**Tipos:** tabela de encontros · mapa · arte · homebrew · aventura/one-shot pronta · ficha · token · tabela de loot · módulo de VTT.

**Taxonomia de filtro:** sistema (D&D 5e, D&D 2024, Tormenta 20, Ordem Paranormal 2, Daggerheart, Call of Cthulhu, genérico…) · tipo de conteúdo · **estilo/tema** (terror, alta fantasia, investigação, urbano…) · nível/tier · gratuito ou pago · formato de arquivo.

**Formatos:** PDF, PNG/JPG/WEBP, JSON/ZIP de VTT (Foundry, Roll20). Limite de 100 MB por arquivo.

**Conteúdo interativo (diferencial competitivo).** Tabelas aleatórias são armazenadas como **dados estruturados**, não como PDF:

- `tabelas_aleatorias` (dado: d20/d66/d100, colunas) + `tabela_itens` (faixa de resultado → texto).
- No site: botão de rolar, resultado destacado, histórico da sessão, botão "rolar tudo" para tabelas aninhadas.
- O PDF é **gerado a partir dos mesmos dados**, sob demanda. Uma fonte, duas saídas — nunca conteúdo duplicado desatualizado.
- Isso também é ouro de SEO: a tabela vira texto indexável na página.

**Kits:** agrupamento curado de suplementos por sistema + tema (ex.: "Kit Ordem Paranormal 2 — Ritualística Urbana"). Pode ser gratuito ou pago. Um suplemento pertence a vários kits.

**Preview de item pago:** primeiras N linhas da tabela visíveis, ou páginas de amostra do PDF, ou versão do mapa em baixa resolução com marca d'água diagonal.

**Marca d'água e rastreio (regra 4.10):**

| | Gratuito | Pago |
|---|---|---|
| Nome/e-mail no rodapé | ❌ | ✅ |
| Nome/e-mail nos metadados | ❌ | ✅ |
| Marca da Quinto Dado no rodapé | ✅ | ✅ |
| Link de download | assinado, 24h | assinado, 15 min, gerado por compra |
| Geração | arquivo estático | on-demand por comprador |

Implementação: `pdf-lib` numa rota de servidor; para imagens, `sharp`. O arquivo personalizado é gerado no momento do download e não é armazenado.

**Licenciamento (4.8, 4.9, 10.3):**
- Conteúdo **pago**: mínimo possível de IA, restrito a licenças abertas dos sistemas (SRD 5.1/CC-BY-4.0 para D&D, licença aberta do Tormenta 20, ORC quando aplicável). Cada suplemento pago tem campos obrigatórios de `licenca_base` e `atribuicao` — o admin não consegue publicar sem preencher.
- Conteúdo **gratuito**: regra mais solta, mas o campo `usa_ia` (bool) é obrigatório e exibido na página. Transparência aqui é reputação.
- Licença ao comprador: **uso pessoal na própria mesa**, sem redistribuição, sem uso comercial. Gratuito: uso pessoal, redistribuição permitida com crédito.
- Marcas de terceiros (D&D, Tormenta, Ordem Paranormal) só aparecem como referência de compatibilidade, com disclaimer no rodapé. Nunca no logotipo, nunca no nome de produto de forma que sugira oficialidade.

### 5.4 Mesas

Modelo inspirado no MesaQuest. Campos de uma mesa:

`titulo` · `slug` · `banner` · `sistema` · `tipo` (one-shot / aventura fechada / campanha) · `sinopse` · `plataforma_vtt` · `plataforma_voz` · `modalidade` (online / presencial) · `cidade_uf` (se presencial) · `tags_tema` · `classificacao` (livre/14/16/18) · `nivel_experiencia` (iniciante/intermediário/avançado/todos) · `vagas_total` · `min_jogadores` · `preco` · `modelo_cobranca` (por sessão / mesa fechada / mensalidade) · `frequencia` (única/semanal/quinzenal/mensal) · `qtd_sessoes` · `data_inicio` · `horario_inicio` · `horario_fim` · `fuso` · `mestre_id` · `status`.

**Estados da mesa:** `rascunho` → `aguardando_aprovacao` → `publicada` → `confirmada` → `em_andamento` → `concluida` · `cancelada`.

Na Fase 1 toda mesa passa por **aprovação prévia do admin** antes de ficar pública (sua regra 8.4). Como só você cria mesas, é auto-aprovação de um clique — a máquina de estados já fica pronta para quando houver terceiros.

**Ficha de inscrição personalizada (6.9).** Cada mesa define perguntas próprias (texto curto, texto longo, múltipla escolha). Duas perguntas são padrão em toda mesa e não podem ser removidas:
- *Linhas e véus* — temas que você não quer que apareçam na mesa.
- *Experiência com o sistema.*

Ferramentas de segurança são diferencial real e sinal de mestre sério.

**Fluxo de inscrição (sua regra 6.3):**

```
1. candidatura_enviada     jogador responde a ficha
2. aguardando_pagamento    recebe link Pix (validade 30 min, QR + copia-e-cola)
3. pago_em_analise         pagamento confirmado por webhook; mestre avalia
4a. aprovado               vaga confirmada → dispara briefing (5.5)
4b. recusado               estorno automático integral em até 24h
5. concluida               após a sessão
```

Estados adicionais: `cancelada_jogador`, `cancelada_mestre`, `expirada` (não pagou em 30 min), `reembolsada`.

**Confirmação da mesa (6.4):** se `inscricoes_aprovadas < min_jogadores` até 24h antes do início, a mesa é **cancelada automaticamente** e todos os pagamentos são estornados integralmente. Job diário.

**Sem lista de espera** (6.6).

### 5.5 Briefing pós-aprovação (6.10)

Ao ser aprovado, o jogador recebe **por e-mail e na plataforma** uma mensagem contendo: saudação personalizada do mestre, WhatsApp do mestre e link do grupo de WhatsApp da mesa. Campos `mensagem_boas_vindas`, `whatsapp_mestre` e `link_grupo_wpp` ficam na mesa e **só são visíveis para inscrições com status `aprovado`** — regra de RLS, não de front-end. É o dado mais sensível do sistema.

### 5.6 Política de reembolso (resposta ao 6.5)

Base legal: **CDC art. 49** (direito de arrependimento de 7 dias em compras fora do estabelecimento, inclusive serviços) e **Código Civil art. 413** (multa compensatória pode ser reduzida judicialmente se excessiva). Não sou advogado e isto precisa de revisão profissional antes de publicar, mas esta é a estrutura que equilibra conformidade e proteção do mestre:

**Mesas**

| Situação | Reembolso | Automático? |
|---|---|---|
| Jogador não aprovado pelo mestre | 100% | Sim, ≤24h |
| Arrependimento: até 7 dias corridos do pagamento **e** ≥48h antes da sessão | 100% | Sim |
| Cancelamento do jogador com ≥7 dias de antecedência da sessão | 100% | Sim |
| Cancelamento do jogador entre 48h e 7 dias | 100% menos taxa do gateway | Sim |
| Cancelamento do jogador com <48h | 50% (multa compensatória) | Sim |
| No-show sem aviso | 0% | — |
| Mesa cancelada pelo mestre, a qualquer momento | 100% | Sim |
| Mesa não atingiu mínimo de jogadores | 100% | Sim |
| Sessão adiada pelo mestre | jogador escolhe: crédito ou 100% | Manual |

**Suplementos pagos.** O art. 49 também alcança conteúdo digital. Política: reembolso integral em até 7 dias da compra, solicitado pela conta. O download é registrado (`downloads`), mas **o pedido é honrado mesmo com download feito** — brigar por R$15 custa mais caro que devolver. Preview obrigatório em todo item pago reduz drasticamente a incidência.

**Regra transversal:** toda cobrança exibe a política resumida na tela antes do pagamento, com link para `/reembolso`. Aceite registrado com timestamp e versão do documento.

### 5.7 Pagamentos

- **Pix apenas** na v1 (7.5). Cartão e recorrência ficam para Fase 2 — recorrência é o que destrava mensalidade de campanha.
- Gateway: **Asaas** como recomendação principal (Pix nativo, aceita pessoa física, API de split e de estorno bem documentada, taxa de Pix baixa). Mercado Pago como alternativa.
- Toda a integração fica atrás de uma interface `PaymentProvider` (`criarCobrancaPix`, `consultarCobranca`, `estornar`, `criarSplit`). Trocar de gateway não deve tocar em regra de negócio.
- **Webhook é a fonte da verdade** do pagamento; nunca confiar em redirect de sucesso. Validar assinatura, tratar entrega duplicada com chave de idempotência.
- **Liberação do valor ao mestre: 24h após o fim da sessão**, via data de liberação do split (§2.1). Na Fase 1, com apenas mesas do admin, o valor cai direto na sua conta e o campo `liberar_em` serve só de registro.
- Doações voluntárias (5.1): página `/apoie` com Pix de valor livre e sugestões de R$5 / R$15 / R$30. Sem contrapartida prometida — doação com contrapartida vira venda e muda o enquadramento.
- Faixas sugeridas quando começarem os pagos (5.3): tabela ou peça avulsa **R$ 7–19**; kit temático **R$ 19–39**; aventura completa ou módulo de VTT **R$ 29–59**.
- Estrutura pronta para internacional (5.6): valores em centavos com coluna `moeda`, nunca `float`.
- Nota fiscal (5.5): fora do escopo agora; `pagamentos` já tem campos de dados fiscais para quando virar MEI.

### 5.8 Notificações (8.3)

Canais: **in-app** (sino + `/conta/notificacoes`) e **e-mail** (Resend). Eventos: nova candidatura (mestre) · pagamento confirmado · aprovado com briefing · recusado com estorno · mesa confirmada · mesa cancelada · lembrete de sessão · reembolso processado.

Lembrete de sessão (24h e 2h antes) é da **Fase 2** conforme sua resposta 6.8, mas a tabela `notificacoes` já suporta agendamento (`enviar_em`).

### 5.9 Painel admin (8.1, 8.2)

Mínimo funcional: criar/editar/publicar mesa · aprovar mesas · subir suplemento (com editor de tabela aleatória) · criar kit · ver e aprovar inscrições · disparar estorno manual · gerir links da home e depoimentos · promover usuário a mestre.

Métricas na v1: visitas · downloads por suplemento · cadastros · conversão visitante→cadastro e visualização de mesa→candidatura · receita do mês · taxa de ocupação das mesas (vagas preenchidas / total).

### 5.9.1 Idioma e internacionalização — **DECIDIDO**

v1 **só em pt-BR**, mas com as rotas preparadas para o inglês não quebrar o SEO depois. Você já anuncia mesas em inglês no MesaQuest, então isso vai acontecer.

**Estratégia de URL — a escolha que importa:** manter o português **na raiz, sem prefixo** (`/mesas`), e reservar o prefixo `/en` para o futuro (`/en/tables`). A alternativa (`/pt/mesas`) obrigaria a redirecionar com 301 toda URL já indexada quando o inglês entrasse — perda de autoridade sem necessidade.

Implementação: `next-intl` com `localePrefix: 'as-needed'` e `defaultLocale: 'pt-BR'`. Todos os textos de interface saem de arquivos de mensagem desde o Alfa, nunca embutidos no JSX — é o trabalho que dói se for feito depois.

No banco: `mesas` e `suplementos` ganham a coluna `idioma` desde já (`pt-BR` | `en-US`), porque a mesa em inglês é um registro próprio, não uma tradução. Tradução de conteúdo do site (páginas institucionais) fica para quando o inglês entrar; aí entra uma tabela `traducoes` ou campos JSONB.

Quando o inglês existir: `hreflang` recíproco em todas as páginas equivalentes e `x-default` apontando para pt-BR.

### 5.10 SEO (9.8 — prioridade alta)

- Renderização no servidor em todas as páginas públicas; nada de conteúdo importante só no cliente.
- `metadata` por página, Open Graph com imagem gerada dinamicamente (`@vercel/og` ou Satori) para mesas e suplementos.
- **JSON-LD**: `Event` para mesas, `Product` + `Offer` para suplementos pagos, `Person`/`Organization` na home, `BreadcrumbList`.
- Slugs legíveis e permanentes; redirect 301 se mudar.
- `sitemap.xml` dinâmico (respeitando o gating etário — conteúdo 18+ fora do sitemap), `robots.txt`, feed RSS de suplementos.
- Páginas-âncora de cauda longa: `/suplementos/sistema/ordem-paranormal-2`, `/suplementos/tipo/tabela-de-encontros`. É o que captura busca do tipo "tabela de encontros ordem paranormal".
- Core Web Vitals: imagens em WEBP/AVIF via `next/image`, fontes locais, zero layout shift.
- Uma tabela aleatória renderizada como texto na página vale mais para o Google do que dez PDFs.

---

## 6. Stack e infraestrutura

| Camada | Escolha |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Banco / Auth / RLS | Supabase (Postgres) |
| Arquivos | Cloudflare R2 (URLs assinadas) |
| Pagamento | Asaas (Pix) |
| E-mail | Resend |
| Analytics | Cloudflare Web Analytics + eventos próprios em `eventos_analytics` |
| Jobs | Cron do provedor → rotas protegidas por token |
| Testes | Vitest (regras de negócio) + Playwright (fluxo de inscrição) |

### 6.1 Aviso sobre hospedagem (orçamento de R$50/mês)

O plano **Hobby da Vercel é destinado a projetos pessoais não comerciais**; um site que vende mesas e suplementos provavelmente exige o plano Pro (~US$20/mês, acima do seu teto). Verifique os termos atuais antes de decidir. Duas alternativas dentro do orçamento:

- **Cloudflare Workers + Pages** via OpenNext — tier gratuito permite uso comercial, e o R2 já fica no mesmo lugar dos arquivos. Recomendação principal.
- **VPS (Hetzner CX22, ~R$25/mês) + Coolify** — mais controle, mais manutenção. Boa opção dado seu perfil de TI.

Custo estimado: domínio `.com.br` ~R$40/ano · Supabase Free · R2 free (10 GB) · Resend Free (3.000 e-mails/mês) · hospedagem R$0–25. **Total dentro dos R$50.**

Ponto de atenção: mapas e artes consomem armazenamento rápido. O R2 tem 10 GB grátis e egresso zero — por isso ele, e não o Storage do Supabase (1 GB).

### 6.2 Domínio (9.3)

Sugestões, em ordem: `quintodado.com.br` · `quintodado.com` · `oquintodado.com.br`. Registre no Registro.br e aponte o DNS para a Cloudflare.

---

## 7. Identidade visual

Extraída da logo: gradiente **azul → roxo**, monograma "5D" branco, padrão de icosaedro (d20) ao fundo.

```
--fundo:        #0B0B14   (tema escuro como padrão — decisão 9.6)
--superficie:   #14142099
--primaria:     #4F7DF3   (azul da logo)
--secundaria:   #9B5CF6   (roxo da logo)
--gradiente:    linear-gradient(135deg, #4F7DF3, #A855F7)
--texto:        #F5F5FA
--texto-suave:  #A0A0B8
--sucesso:      #34D399
--alerta:       #FBBF24
--erro:         #F87171
```

Tipografia: display com personalidade nos títulos (Cinzel, Sora ou Space Grotesk), sans neutra e legível no corpo (Inter). Cantos suaves, superfícies com leve transparência, o padrão de d20 usado como textura discreta de fundo — nunca competindo com o conteúdo.

**Mobile-first obrigatório** (9.5), com layout desktop trabalhado, não apenas esticado. Referência de estrutura: MesaQuest e Tavernaria; StartPlaying (startplaying.games) como maior referência estrangeira. Referência de tom: mais pessoal e autoral que todas — é o site de uma pessoa, não de um marketplace.

---

## 8. Segurança e privacidade

- **RLS ligado em todas as tabelas.** Regra: negar por padrão, liberar explicitamente. O `service_role` só existe no servidor, jamais no cliente.
- Dados sensíveis por definição: WhatsApp do mestre, respostas de linhas e véus, data de nascimento, dados do responsável. Todos com política de leitura restrita.
- Links de arquivo sempre assinados e expiráveis. Nada de bucket público.
- Rate limit em candidatura, login e geração de cobrança.
- LGPD: página de exclusão de conta e exportação de dados (art. 18), banner de cookies com opção real de recusa, registro de aceite de termos com versão e timestamp.
- Menores de 18 em mesa paga: fluxo de consentimento do responsável (§2.3).
- Auditoria (`audit_log`) para: mudança de papel, aprovação/recusa de inscrição, estorno, publicação de mesa.

---

## 9. Roadmap

### Alfa — semana 1
Objetivo: site no ar, captando audiência, com pagamento manual.

- [ ] Projeto, design tokens, layout base, tema escuro
- [ ] `next-intl` configurado (`localePrefix: 'as-needed'`, pt-BR na raiz) — textos em arquivos de mensagem desde o primeiro commit
- [ ] Home + `/links` + `/sobre` + rodapé legal
- [ ] Auth (Google, Discord, e-mail) + perfil + papéis + gating etário
- [ ] Catálogo de suplementos **gratuitos** com filtros + download com link assinado
- [ ] Tabela aleatória interativa (uma peça, para validar o formato)
- [ ] `/mesas` + detalhe + candidatura com ficha personalizada (**sem pagamento** — você combina o Pix na mão)
- [ ] Admin mínimo: mesa, suplemento, inscrições, links, depoimentos
- [ ] SEO base: metadata, OG, sitemap, JSON-LD
- [ ] Termos, Privacidade, Reembolso, Licença (rascunhos)

### v1 estável — semanas 2 e 3
- [ ] Asaas Pix + webhook + máquina de estados completa da inscrição
- [ ] Estorno automático (recusa, mínimo não atingido, cancelamento)
- [ ] Briefing pós-aprovação (e-mail + in-app) com WhatsApp e grupo
- [ ] Consentimento de responsável para menores
- [ ] Suplementos pagos: compra, preview, marca d'água com nome/e-mail e metadados
- [ ] Kits temáticos
- [ ] `/apoie` com doação Pix
- [ ] Notificações in-app e por e-mail
- [ ] Métricas no admin
- [ ] Testes do fluxo de pagamento ponta a ponta

### Fase 2 — depois
Mestres convidados com split · avaliações mútuas · blog · lembretes automáticos de sessão · calendário com fuso · cartão e recorrência para campanhas · candidatura pública a mestre · assinatura · internacional.

**Priorize o one-shot.** Todas as suas mesas hoje são one-shots avulsos de R$35–40. Campanha, mensalidade e cobrança recorrente são casos que você ainda não usa — não gaste semana de Alfa neles.

**Aviso honesto sobre o prazo:** uma semana para o Alfa é apertado mas viável se o pagamento ficar de fora — que é exatamente o recorte acima. Três semanas para a v1 com Pix, estorno automático e marca d'água é agressivo para uma pessoa só. Se algo escorregar, corte primeiro os **suplementos pagos** (você ainda não tem catálogo pago pronto) e mantenha as mesas: é ali que está a receita hoje.

---

## 10. Definição de pronto

Cada entrega só está pronta quando: funciona no mobile · respeita RLS (testado com usuário de outro papel) · tem estado de carregamento e de erro · tem estado vazio pensado (catálogo sem itens, mesa sem inscritos) · página pública tem metadata e OG · texto em pt-BR sem jargão · regra de dinheiro coberta por teste automatizado.

---

## 11. Pendências para você

1. **Aprovar os textos** de `Textos_QuintoDado_v1.md` (home, `/sobre`, `/links`, SEO).
2. **Escolher o gateway**: Asaas ou Mercado Pago (abra a conta antes da semana 2).
3. **Registrar o domínio.**
4. **Escolher a hospedagem** à luz do §6.1.
5. **Perguntar ao gateway** se o split de Pix permite agendar a data de liberação (§2.1). Só é bloqueante para a Fase 2, mas a resposta muda a arquitetura de repasse.

Decisões fechadas em 06/09/2026: comissão de 0% na faixa R$5–9,99 · termo do responsável para menores de 18 em mesa paga · pt-BR na v1 com rotas preparadas para o inglês · liberação do repasse 24h após o fim da sessão, via split do gateway.
