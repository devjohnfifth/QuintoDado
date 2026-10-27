# Plano visual v2 — Quinto Dado

> Auditoria página a página, seção a seção, feita em 27/10/2026 sobre o site
> rodando local. Nada aqui foi implementado ainda: é a lista pra você aprovar,
> cortar ou reordenar antes de a gente mexer em código.
>
> Legenda de cada item: **impacto** (quanto o olho percebe) · **esforço**
> (quanto custa fazer). Itens marcados 🔒 dependem de arte sua (capas, fotos).

---

## Estado da implementação (27/10/2026)

**Lote A entregue**, mais a paginação (fora do plano original, pedida depois) e
o favicon. Nada subiu pro ar ainda.

| Item | O que foi feito |
|---|---|
| G1 · G2 | Escala fluida (`titulo-hero`, `titulo-pagina`, `titulo-secao`, `titulo-bloco`, `rotulo-caps`) aplicada em todo H1/H2 público; corpo a 17px |
| G6 | `halo-marca` no layout: toda página abre com azul→roxo no alto, atrás do conteúdo |
| G7 | Âmbar virou a cor do dado e dos números — contadores do herói, ícones do fechamento, página ativa da paginação |
| G9 | `borda-luz` + superfícies `painel`/`bg-superficie` no rodapé e nos blocos novos |
| G16 | `.cascata`: cards entram ao alcançar a tela, com desencontro por coluna |
| G18 | `.parallax-heroi`: a foto do herói sobe devagar na rolagem |
| G25 | `GradeAdaptavel`: 1 item = destaque largo, 2 = meia largura, 3 = duas colunas com o terceiro atravessando |
| NAV1 | Barra encolhe de 64 pra 52px e ganha sombra ao rolar |
| NAV5 | Rodapé com logo grande, trama de d20, fio de luz e redes coloridas |
| H3 · H6 | Herói em 78vh, três números com contador animado, dica de rolagem |
| H7 | Carrossel com bolinhas no celular, setas que desativam e degradê nas pontas |
| M7 · S7 · E2 | `BlocoFechamento` em `/mesas`, `/suplementos`, `/eventos` e `/presencial-bh`; estado vazio de eventos virou bloco de tela cheia com foto real do UAIventura |
| **IC1–IC6** | Favicon refeito pro corte circular do Google (ver 2.16) |
| **PG1–PG6** | Paginação (ver 2.17) |
| **Imagens** | Capivara aventureira no herói do `/presencial-bh`; 5 fotos do UAIventura em `src/assets/eventos/` |

Tudo com `pnpm build`, `pnpm lint` e `pnpm test` (37/37) passando.

**Movimento é CSS puro** (`animation-timeline`), sem JS e sem
IntersectionObserver: o conteúdo sai visível do servidor, e quem não tem
suporte ou pediu menos movimento vê a versão parada. Nada fica preso
invisível.

**Lote B entregue** na sequência:

| Item | O que foi feito |
|---|---|
| G11 | `D20MarcaDagua`: silhueta de d20 em SVG, usada bem apagada atrás das capas e do `/links` — o primeiro elemento gráfico autoral do site |
| M1 · S1 · E1 | `CapaPagina`: faixa sangrada no topo de `/mesas`, `/suplementos` e `/eventos`, com foto quando faz sentido, trama de d20 e título em display |
| MD2 · MD3 · MD4 | Mesa: capa de borda a borda, **sempre presente** (fundo gerado por slug quando não há banner), título por cima, mestre com avatar maior |
| SD1 · SD2 | Suplemento: mesma capa sangrada, com migalhas, selos e título em cima dela |
| ED1 | Evento: capa sangrada e a **data em bloco de calendário** ao lado do título — era a informação que decide e estava perdida numa fileira de pílulas cinzas |
| SO1 | `/sobre`: capa de meia tela com parallax; abertura em largura de leitura com fio âmbar; pilares em painel com ícone grande |
| L1 · L3 · L5 | `/links`: foto do Quintão com anel em gradiente, cor própria por rede, d20 no fundo e **sem header nem rodapé** — é link-in-bio, tela limpa |
| A1 | `/entrar`: tela cheia em duas colunas, foto sangrando de um lado e o formulário centralizado do outro |

### Um bug que apareceu no caminho

O `/links` que "não renderizava" não era defeito do navegador embutido: os
links usavam `animation-fill-mode: backwards` com atraso, o que deixa o
elemento em `opacity: 0` **até a animação começar**. Se ela não começa — aba
em segundo plano, pintura suspensa —, o conteúdo fica invisível pra sempre.

Regra que fica: **conteúdo nunca depende de uma animação rodar pra aparecer.**
A entrada agora usa `.cascata` (ligada à rolagem), em que quem já está na tela
aparece pronto. O mesmo padrão antigo ainda existe no menu do celular
(`mobile-nav`), com risco bem menor porque ele só abre por toque — vale
trocar quando mexermos nele (NAV4, lote D).

### Ajustes depois do Lote B (pedidos na revisão)

- **`/eventos`**: a capa tinha a mesma foto que abre o bloco logo abaixo —
  duas fotos iguais empilhadas. A capa ficou só com a trama de d20, como em
  `/suplementos`, e a foto aparece uma vez só.
- **Admin**: o nav de seções (Painel · Mesas · Eventos · Suplementos ·
  Usuários) aparecia por cima dos formulários de criar e editar. Virou
  `AdminNav`, que em rota de formulário (`/nova`, `/novo`, `/editar`) troca o
  nav por um "voltar pra <seção>" — no meio de preencher um formulário, cinco
  saídas no topo só convidam a perder o que foi digitado. De quebra, a seção
  atual agora fica marcada em âmbar nas telas de lista.

### Painel da mesa — antecipado do lote D (PN1–PN3, PN6)

Pedido do João: "as informações ficam muito misturadas".

| Item | O que foi feito |
|---|---|
| PN1 | Faixa fina com a arte da mesa no topo do painel, com "voltar pra mesa", o título em display e um selo dizendo se você é mestre ou jogador |
| PN2 | Abas com ícone, **contador por aba** e marcação em âmbar na ativa — antes eram três pílulas iguais sem indicação de volume |
| PN3 | **A ficha de entidade foi a correção principal.** Nome, autoria, selo de visibilidade e três botões dividiam o mesmo `flex-wrap` e embaralhavam no celular. Agora são dois blocos: identidade à esquerda (nome grande, "criado por" como linha pequena embaixo) e todas as ações agrupadas à direita. A visibilidade virou um **fio de cor na lateral** (vermelho = só o mestre vê, verde = a mesa toda), que lê melhor que a borda tracejada |
| PN6 | Grupos de tipo com título em display, contagem e um fio embaixo — antes as fichas de tipos diferentes viravam uma lista só |
| — | Visão geral com superfície de painel e o número grande em âmbar na frente |
| — | `listarEntidades`/`listarSessoes` passaram a ser memoizadas por requisição (`cache`), senão as contagens das abas dobrariam as idas ao banco |

### Revertido a pedido

- **Capa do `/sobre` (SO1)**: o herói sangrado de meia tela com parallax saiu;
  voltou o cartão emoldurado dentro da coluna, que é o enquadramento que o
  João prefere. A tipografia em display ficou.

**Lote C entregue** (os blocos que vendem):

| Item | O que foi feito |
|---|---|
| SD5 | O teatro do dado ganhou palco: superfície alta, d20 atrás e título em display. Rolar é a assinatura do site e acontecia numa caixa cinza igual às outras |
| SD6 | Já estava feito — o seletor de tabela virou abas antes; agora segue a convenção âmbar |
| MD6 | O bloco que decide a candidatura: preço em display 4–5xl em âmbar, com rótulo em caixa-alta e um fio de luz da marca em volta |
| MD9 | "Detalhes" virou três fichas com ícone grande, rótulo em caixa-alta e valor em display — era o bloco mais apagado da página e carrega o que define se a mesa serve |
| ED2 | Cartão de ingresso com picote (as mesmas duas mordidas do card de mesa), preço em display e "restam N" em âmbar, que só aparece quando está mesmo acabando |
| ED3 | Barra de lotação do evento: o número existia no banco e não aparecia pra quem decide comprar |
| M9 | O picote do card de mesa ganhou contraste — a linha tracejada sumia no escuro |
| SO4 | "Segurança em primeiro lugar" virou o bloco mais pesado da página, com escudo grande e o verde da convenção. É o diferencial real da casa e dividia peso com todo o resto |
| SO5 | Foto do Quintão grande, com anel em gradiente |
| SO6 | Os sistemas viraram **logos em linha** (as mesmas do card de mesa) no lugar de nomes separados por ponto; o texto fica pra leitor de tela e pra busca |
| H19 | Bloco de comunidade da home com brilho e d20 atrás |

**Lote D entregue** (identidade e refinamento):

| Item | O que foi feito |
|---|---|
| G10 | **Cor por sistema de RPG** (`COR_SISTEMA`): fio da cor no card de mesa e o nome do sistema na mesma cor. Uma lista de mesas de sistemas diferentes parecia a mesma mesa repetida — é variedade de cor sem pedir arte nova |
| G20 | `BrilhoCursor`: brilho que segue o ponteiro dentro do card, na cor do sistema. Componente cliente mínimo que escuta o pai, então o card continua sendo de servidor; não liga em toque nem com movimento reduzido |
| H8 | A notícia mais nova abre a seção em destaque, larga; o resto segue na trilha |
| H17 · H18 | FAQ com número em face de dado âmbar, d20 no fundo e resposta animada ao abrir |
| P2 | "Como funciona" do presencial virou três passos numerados — o parágrafo corrido respondia o mesmo, mas era fácil de pular |
| NAV4 | Menu móvel mais largo, itens maiores e título em display |
| NAV7 | 404 com "você rolou 1 na navegação", d20 no fundo e três caminhos de volta. **E uma lacuna fechada:** endereços que não casam com rota nenhuma caíam no 404 preto-e-branco do Next, porque não chegam no layout de `[locale]`. Agora há um `app/not-found.tsx` global que monta o próprio documento |
| PN5 | Sessões em linha do tempo vertical, com o número no marco; o cabeçalho do card recebeu a mesma separação da ficha de entidade |
| C4 | Ingressos da conta com cara de ingresso: canhoto, picote e as duas mordidas |

### O que eu não fiz do lote D, e por quê

- **G14 (divisor de seção com d20)**: você recusou ornamento entre seções
  duas vezes. Não vou reintroduzir por conta própria — se quiser tentar a
  versão com d20, é só pedir.
- **G12 (textura de mapa)**: já existem trama de hexágono, grão e a silhueta
  do d20. Uma quarta camada de textura vira ruído, não identidade.
- **G13 (moldura de ficha chanfrada)**: brigaria com o picote de ingresso,
  que já é a moldura característica dos cards.
- **G17 (transição com morph de capa)** e **C1 (capa de perfil na conta)**:
  os dois já estavam na lista de "recomendo cortar".

### Correção de rota no caminho

A troca de `backwards` por `forwards` no menu móvel estava errada: com atraso,
`forwards` faz o item aparecer, sumir e voltar. O certo ali é `both` — e é
seguro porque a gaveta monta no toque, com a página já pintando. O caso
perigoso era o `/links`, conteúdo de primeira pintura, e esse usa entrada
ligada à rolagem.

### Volta à paleta da marca (27/10/2026)

Pedido do João: "uso muito exagerado da cor amarela que sai completamente da
minha paleta". Ele está certo — e o erro foi meu. O token `--qd-acento`
(#f2a93b) não existe em `CLAUDE.md`: eu o inventei numa rodada anterior como
"acento quente" e depois fui usando em tudo — números do herói, ícones de
capa, abas, paginação, preços, FAQ, marcos da linha do tempo, passos
numerados. Virou a cor dominante de um site cuja identidade é azul e roxo.

O que foi feito:

- `--qd-acento` e `--qd-acento-suave` saíram dos tokens, junto com o
  utilitário `text-acento` e os mapeamentos de tema
- as 48 ocorrências viraram `primary` (azul da marca); o MesaQuest ficou em
  `secondary` (roxo) pra não deixar tudo de uma cor só
- o clarão do fundo gerado e o brilho do resultado do dado voltaram pro roxo
  e pro azul
- `--qd-sucesso`, `--qd-alerta` e `--qd-erro` **ficam**: são semânticas
  (confirmado, atenção, erro), já existiam antes e têm uso pontual. Se o
  amarelo do `alerta` também incomodar, é um ajuste separado

**Um bug que apareceu na conferência:** os três números do herói apareciam
como **0**. O `NumeroAnimado` zerava e contava via `requestAnimationFrame`,
que não roda com a aba em segundo plano — o número ficava parado no zero e
mostrava "0 mesas abertas". Agora ele não começa com a página escondida e tem
um `setTimeout` de garantia que crava o valor final mesmo sem quadro nenhum.
É a mesma família do bug do `/links`: **nada que o visitante precisa ver pode
depender de uma animação rodar.**

### Achado de segurança (27/10/2026) — fora do plano visual

Fui implementar o E3 (seção "já aconteceu" em `/eventos`), li a RLS de
eventos pra entender o filtro de status e encontrei outra coisa.

**O problema.** A política `evento_leitura` é por LINHA
(`status = 'publicado' or eh_admin()`) e os grants do projeto são de tabela
inteira (`grant all on all tables in schema public to anon`). Juntando as
duas, qualquer visitante com a chave anônima — que é pública por definição,
vai no bundle do navegador — conseguiria ler de um evento publicado:

    GET /rest/v1/eventos?select=chave_pix,whatsapp_confirmacao

Havia ainda uma segunda via: `ComprarIngressoButton` é componente de cliente
e recebia `chavePix` e `whatsappConfirmacao` como props, então os dois
viajavam no **payload de RSC** de uma página pública, visíveis pra quem nem
tem conta. É literalmente o que a regra 4 do `CLAUDE.md` proíbe.

Hoje nada vaza porque não existe evento publicado. Vazaria no próximo.

**O que foi feito no código (já commitado):**

- a página do evento não lê mais `chave_pix` nem `whatsapp_confirmacao`
- os dois saem por uma `dadosPagamentoAction`, que exige sessão e só é
  chamada quando a pessoa abre o diálogo de compra
- o botão de comprar não recebe mais esses dados como prop

**O que falta — e depende de você rodar:** a migration
`20261027120000_eventos_colunas_sensiveis.sql` revoga o `select` de tabela
cheia do `anon` e devolve só as colunas públicas. `authenticated` continua
lendo, porque quem compra precisa da chave.

**Confirmado que ainda NÃO rodou**: pela chave anônima,
`select=chave_pix,whatsapp_confirmacao` ainda responde 200. O código novo
funciona antes e depois da migration, então não há pressa de ordem — mas o
buraco só fecha quando ela for aplicada.

### Próximos
Lote E, que depende de você: capas dos suplementos e a lista de locais do
presencial (P5). O E3 ("já aconteceu") precisa de uma decisão sua: hoje a RLS
esconde evento encerrado do público, então a seção exige abrir `encerrado`
pra leitura anônima.

---

## Parte 0 — Por que a rodada passada mudou pouco

Antes da lista, o diagnóstico honesto do que eu fiz e por que não apareceu:

1. **Mexi na textura, não na planta.** Grão, painel, sombra, hover e um âmbar
   de acento são, por definição, sutis. O que o olho lê como "design" é
   **hierarquia, imagem grande, cor saturada, ritmo e movimento** — e isso
   continuou igual.

2. **A planta é a mesma em toda página.** Header → título pequeno → grade de
   cards → rodapé. Da home ao suplemento, nada muda de forma. Um site com
   personalidade visual troca de estrutura entre páginas.

3. **As páginas estão vazias.** `/mesas` tem 1 card e ~60% de tela preta até o
   rodapé. `/suplementos` tem 5 cards e para. `/eventos` tem uma caixinha de
   "nenhum evento" solta no meio do nada. **Esse é o maior fator de "sem
   graça" — e não se resolve com cor, se resolve com conteúdo ocupando a
   tela.**

4. **Só 2 das 12 páginas públicas têm capa com imagem** (`/sobre` e
   `/presencial-bh`). As outras abrem com um quadradinho de ícone 40×40 e um
   título. Inconsistência que o visitante sente mesmo sem saber nomear.

5. **A paleta quase não é usada.** Azul e roxo aparecem só em botão, selo e
   ícone de 16px. O preto `#0B0B14` ocupa 90% de cada tela.

6. **Zero elemento gráfico autoral.** Sem d20, sem mapa, sem moldura, sem
   textura de papel, sem ilustração. A marca é um logo no header e nada mais.

7. **Movimento quase inexistente.** Um fade ao rolar e um `translateY(-2px)` no
   hover. Nenhuma transição entre páginas, nenhum stagger, nenhuma reação ao
   cursor.

A lista abaixo ataca os sete pontos nessa ordem de importância.

---

## Parte 1 — Sistema (conserta todas as páginas de uma vez)

Esta parte é o alicerce. Se só der pra fazer uma parte do plano, faça esta.

### 1.1 Tipografia

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| G1 | Títulos de seção em `text-3xl/4xl`, corpo em 16px — escala curta demais | Escala fluida com `clamp()`: H1 de página 40→72px, H2 de seção 32→48px, corpo 17px, apoio 15px. Diferença grande entre níveis é o que faz parecer "editorial" | Alto | Baixo |
| G2 | `titulo-display` só é usado na home | Aplicar em **todo** H1 e H2 público (listas, detalhes, legais) | Alto | Baixo |
| G3 | Uma fonte de título só, sem variação | Adicionar um peso/estilo de destaque: números de dado e rótulos em caixa-alta com `letter-spacing` largo (`.rotulo-caps`) | Médio | Baixo |
| G4 | Parágrafos com largura livre | Travar leitura em `max-w-[65ch]` em sinopse, sobre e legais | Médio | Baixo |
| G5 | Nenhum texto com tratamento gráfico | Lettra capitular (primeira letra grande) na sinopse de mesa e no corpo do suplemento | Médio | Baixo |

### 1.2 Cor e superfície

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| G6 | Preto chapado em 90% da tela | Fundo com **halo de marca fixo** no topo de cada página (azul→roxo a 12% de opacidade, 400px de altura) — a página nasce colorida, não preta | Alto | Baixo |
| G7 | ~~Usar um âmbar como cor do dado e do "grátis"~~ | **Revertido em 27/10/2026.** O âmbar não está em `CLAUDE.md` — foi introduzido por mim e acabou espalhado pelo site inteiro, puxando tudo pra fora da identidade. A hierarquia volta a sair do azul, do roxo e do gradiente | — | — |
| G8 | Uma superfície só (`card/60`) | Três degraus de superfície já existem (`painel`, `painel-alto`) mas são usados pouco — padronizar: fundo < painel < painel-alto < card em destaque | Médio | Médio |
| G9 | Bordas todas iguais (`border-border`) | Borda superior clareada (fio de luz) em todo painel; borda colorida só no item em foco | Médio | Baixo |
| G10 | Sem cor por sistema de RPG | Cada sistema ganha um matiz (Ordem = vermelho, Tormenta = dourado, Daggerheart = teal…) usado no selo e no fio da capa. Dá variedade de cor de graça | Alto | Médio |

### 1.3 Elementos gráficos autorais

| ID | O que fazer | Impacto | Esforço |
|---|---|---|---|
| G11 | **Silhueta de d20 em SVG** como marca d'água: grande, 3–4% de opacidade, no canto de heróis e blocos de destaque. É o elemento que falta pra tela não ser só retângulos | Alto | Baixo |
| G12 | **Textura de mapa/pergaminho** (linhas de contorno em SVG) no fundo das seções alternadas, em vez do grão genérico | Alto | Médio |
| G13 | **Moldura de ficha**: cantos chanfrados + fio duplo em cards de destaque, pra lembrar ficha de personagem | Alto | Médio |
| G14 | **Divisor de seção com d20**: a versão que você recusou era um losango genérico. A certa é um d20 pequeno em linha, com o fio sumindo só na cor do próprio fundo (sem degradê atravessando troca de fundo) | Médio | Baixo |
| G15 | **Ícones de sistema** já existem (logos) — usar também como marca d'água grande e desbotada atrás do card | Médio | Baixo |

### 1.4 Movimento

| ID | O que fazer | Impacto | Esforço |
|---|---|---|---|
| G16 | **Stagger nas grades**: cards entram em cascata (40ms entre eles), não todos juntos | Alto | Baixo |
| G17 | **Transição entre páginas** com `view-transition-name` na capa: a capa do card vira a capa da página de destino | Alto | Médio |
| G18 | **Parallax leve** na foto do herói (8–12% de deslocamento na rolagem) | Alto | Baixo |
| G19 | **Contador animado** nos números (vagas, suplementos, mesas) ao entrar na tela | Médio | Baixo |
| G20 | **Hover com brilho que segue o cursor** nos cards (radial-gradient na posição do mouse) | Alto | Médio |
| G21 | **Barra de progresso de leitura** no topo das páginas longas (suplemento, sobre, legais) | Médio | Baixo |
| G22 | Respeitar `prefers-reduced-motion` em tudo acima (já é padrão no projeto) | — | Baixo |

### 1.5 Densidade (o problema das páginas vazias)

| ID | O que fazer | Impacto | Esforço |
|---|---|---|---|
| G23 | **Nenhuma página pública termina sem um bloco de fechamento.** Toda lista curta ganha, abaixo da grade: "o que mais tem aqui" (3 atalhos ilustrados) + bloco da comunidade | Alto | Médio |
| G24 | **Rodapé com presença**: hoje é texto cinza em 4 colunas. Vira bloco com a foto/logo grande, a textura de d20 e o CTA de WhatsApp destacado | Alto | Médio |
| G25 | **Altura mínima de conteúdo**: quando a grade tem ≤3 itens, os cards crescem (2 colunas em vez de 3) em vez de deixar sobra | Alto | Baixo |

---

## Parte 2 — Página a página

### 2.1 Home (`/`)

**Seção: Herói**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H1 | Foto de grupo a 60% com máscara radial; funciona, mas é estática | Parallax na foto + d20 em marca d'água girando devagar | Alto | Médio |
| H2 | Título "Quinto Dado" em gradiente, 2 linhas no celular | Travar em 1 linha no celular (`text-5xl`) e dar um `text-shadow` de brilho mais forte | Médio | Baixo |
| H3 | Dois selos de estatística ("1 mesa aberta", "5 suplementos") empilham e ficam tortos no celular | Virar uma barra única de 3 números com contador animado: mesas · suplementos · jogadores na comunidade | Alto | Baixo |
| H4 | Dois botões, ambos do mesmo tamanho | Hierarquia: CTA de comunidade grande com brilho pulsante suave; "ver mesas" vira link com seta | Médio | Baixo |
| H5 | Nada indica que há conteúdo abaixo | Seta/dado "role pra baixo" animado no fim do herói | Médio | Baixo |
| H6 | Herói ocupa só ~55% da tela no desktop | Subir pra ~75vh e deixar o primeiro card espiar na borda inferior | Alto | Baixo |

**Seção: Notícias**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H7 | Carrossel sem indicador visível no celular — os cards são cortados na borda e não há seta nem bolinha | Setas no desktop, bolinhas de posição no celular, e borda com degradê indicando que continua | Alto | Baixo |
| H8 | Todos os cards do mesmo tamanho | Primeiro item em destaque (2× de largura), resto menor | Alto | Médio |
| H9 | Selo "Novo" discreto | Selo "Novo" em âmbar com brilho; data relativa ("há 3 dias") | Médio | Baixo |
| H10 | Título "Notícias" genérico | Trocar por algo com voz: "Saiu da forja" / "Novidades da mesa" | Baixo | Baixo |

**Seção: Últimos suplementos**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H11 | Capas procedurais (roxo com hexágono) — todas muito parecidas entre si | 🔒 Trocar pelas capas reais; até lá, aumentar a variação (matiz por sistema, não por slug) | Alto | Baixo |
| H12 | Grade de 2 cards deixa sobra | Quando houver 2, virar lista horizontal larga com capa à esquerda | Médio | Baixo |
| H13 | Nada mostra que a tabela é interativa | Selo "role aqui" com ícone de d20 no card de tabela | Alto | Baixo |

**Seção: Mesas abertas**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H14 | 1 mesa só, em destaque horizontal — fica solta | Quando há 1 mesa, virar bloco largo com a capa sangrando até a borda da tela | Alto | Médio |
| H15 | Cadeiras de vaga são pequenas e sem legenda | Aumentar, dar brilho na cadeira vazia e rótulo "2 vagas livres" ao lado | Médio | Baixo |
| H16 | Sem caminho quando não há mesa aberta no site | Bloco fixo "minhas mesas no MesaQuest" com link | Alto | Baixo |

**Seção: FAQ**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H17 | Lista de `<details>` sem animação, abre seco | Animar a abertura (altura + fade) e girar o chevron | Médio | Baixo |
| H18 | Bloco cinza sem personalidade | Numerar as perguntas com números de dado em âmbar; d20 em marca d'água no fundo | Médio | Baixo |

**Seção: Comunidade**

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| H19 | Caixa com brilho de marca, ícone e botão — é o melhor bloco da home hoje | Manter a direção e subir a aposta: textura de d20, borda luminosa animada, e prova social ("X pessoas no grupo") | Alto | Médio |

---

### 2.2 Mesas — lista (`/mesas`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| M1 | Topo | `PageHeader`: quadradinho de ícone + título + subtítulo sobre preto | Capa de página: faixa de 280px com foto de mesa, título em display grande, d20 em marca d'água | Alto | Médio |
| M2 | Filtros | Três `<select>` nativos — destoam de tudo (fonte e seta do SO) | Trocar por "fichas" clicáveis (chips) com o matiz do sistema; o `<select>` só volta no celular | Alto | Médio |
| M3 | Filtros | Botão "Filtrar" obriga submit | Filtrar ao escolher (form com `useRouter`), sem botão | Médio | Médio |
| M4 | Filtros | Nenhum resumo do resultado | "3 mesas · 2 online" acima da grade | Baixo | Baixo |
| M5 | Grade | 1 card e o resto da tela vazia | Com ≤2 mesas: card largo com capa sangrada (ver G25) | Alto | Baixo |
| M6 | Grade | Cards todos no mesmo peso | Primeira mesa (a que começa antes) em destaque | Médio | Baixo |
| M7 | Fim da página | Acaba na grade, sobra preto até o rodapé | Bloco de fechamento: "não achou mesa?" → MesaQuest + comunidade + suplementos (G23) | Alto | Médio |
| M8 | Estado vazio | `EstadoVazio` pequeno e cinzento | Ilustração de d20 grande + dois caminhos (comunidade / MesaQuest) | Alto | Baixo |
| M9 | Card de mesa | O "picote de ingresso" é uma boa ideia mas some no escuro | Reforçar: fundo do talão mais claro que o da página, picote mais contrastado, sombra embaixo | Alto | Baixo |

---

### 2.3 Mesa — detalhe (`/mesas/[slug]`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| MD1 | Migalhas | Texto cinza pequeno no topo | Manter, mas colar no topo da capa, sobre a imagem | Baixo | Baixo |
| MD2 | Capa | Banner 21:9 dentro da coluna, com borda | Capa sangrando de borda a borda da tela, com degradê pro fundo e o título **sobre** ela | Alto | Médio |
| MD3 | Capa | Só aparece se houver `banner_url` | Sempre ter capa (fundo gerado quando não houver), como já fiz no suplemento | Alto | Baixo |
| MD4 | Título | `font-heading text-3xl` solto abaixo da capa | `titulo-display`, 48–64px, sobre a capa | Alto | Baixo |
| MD5 | Mestre | Avatar 28px + "Mestrado por X" | Bloco de autoridade: avatar 48px, nome, e "N mesas mestradas" | Médio | Médio |
| MD6 | Resumo/preço | Caixa cinza com preço azul, 4 ícones, cadeiras e botão — está bom, mas é o bloco mais importante e não parece | Virar o "cartão de ingresso" da página: painel-alto, borda luminosa, preço em display grande, picote na lateral | Alto | Médio |
| MD7 | Cadeiras | Boa ideia, pequena demais no detalhe | `tamanho="lg"`, cadeira vazia pulsando devagar, nome no hover | Médio | Baixo |
| MD8 | Sinopse | Texto corrido com "Ler mais" — o degradê de corte é discreto demais | Lettra capitular, `max-w-[65ch]`, degradê de corte mais marcado e botão com seta | Médio | Baixo |
| MD9 | Detalhes | `<dl>` de 3 colunas em caixa cinza — o bloco mais apagado da página | Três "fichas" com ícone grande, rótulo em caixa-alta e valor em display | Médio | Baixo |
| MD10 | Candidatura | Formulário solto no fim | Encerrar com painel-alto, título grande e selo de "linhas e véus combinados antes" | Médio | Baixo |
| MD11 | Barra móvel | Existe (`BarraAcaoMovel`) e funciona | Dar fundo com blur e o preço à esquerda em destaque | Baixo | Baixo |
| MD12 | Fim da página | Termina na candidatura | "Outras mesas abertas" (3 cards) + comunidade | Alto | Médio |

---

### 2.4 Suplementos — lista (`/suplementos`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| S1 | Topo | `PageHeader` com ícone pequeno | Capa de página com textura de mapa + d20; título "Material para a sua mesa" em display grande | Alto | Médio |
| S2 | Topo | Nenhum número | "5 suplementos · 4 tabelas · tudo de graça" com contador | Médio | Baixo |
| S3 | Filtros | Dois `<select>` nativos | Mesmo tratamento de M2 (chips por tipo e por sistema) | Alto | Médio |
| S4 | Grade | 5 capas procedurais quase idênticas (roxo + hexágono) | 🔒 Capas reais; enquanto isso, variar por **tipo** (tabela = losango âmbar, mapa = contorno, homebrew = hexágono) | Alto | Baixo |
| S5 | Grade | Card não diz quantas entradas a tabela tem | Selo "d20 · 20 entradas" no canto da capa | Alto | Baixo |
| S6 | Grade | Todos do mesmo tamanho | Primeiro card em destaque 2× | Médio | Médio |
| S7 | Fim | Grade acaba e sobra preto | Bloco "tabelas novas toda semana — entre no grupo" + próximos lançamentos | Alto | Médio |
| S8 | — | Não há agrupamento | Seções por tipo ("Tabelas de encontros", "Homebrew", "Mapas") quando houver >8 itens | Médio | Médio |

---

### 2.5 Suplemento — detalhe (`/suplementos/[slug]`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| SD1 | Capa | Faixa 21:9 com fundo gerado + degradê (feito na rodada passada) | Sangrar até as bordas da tela e colocar título + selos **sobre** ela | Alto | Médio |
| SD2 | Título | Abaixo da capa, display 4xl/5xl | Subir pra cima da capa, 56–72px | Alto | Baixo |
| SD3 | Selos | Três selos pequenos acima do título | Virar linha de metadados com ícone: tipo · sistema · d20 · nº de entradas · "grátis" em âmbar | Médio | Baixo |
| SD4 | Resumo | Parágrafo de apoio | Lettra capitular + `max-w-[65ch]` | Médio | Baixo |
| SD5 | Tabelas | **O melhor da página.** Botão "Rolar d20", resultado em âmbar, linha acende | Dar palco: fundo de painel-alto, d20 em marca d'água, e um botão "rolar" grande e fixo no celular | Alto | Médio |
| SD6 | Tabelas | Seletor de tabela quando há várias | Virar abas com o nome e o dado de cada uma, não um `<select>` | Médio | Baixo |
| SD7 | Tabelas | Resultado some ao rolar a página | Fixar uma faixa fina no topo com o último resultado enquanto estiver na tabela | Médio | Médio |
| SD8 | Tabelas | Não dá pra levar o resultado embora | Botão "copiar resultado" e "copiar tabela em markdown" | Médio | Baixo |
| SD9 | Arquivos | Lista de downloads simples | Cartão por arquivo com ícone do formato, tamanho e botão âmbar | Médio | Baixo |
| SD10 | Fim | "Mais suplementos" em grade | Manter, mas com capa grande e o CTA de comunidade logo abaixo | Médio | Baixo |
| SD11 | — | Sem barra de progresso em página longa | Barra de leitura no topo (G21) | Médio | Baixo |

---

### 2.6 Eventos — lista (`/eventos`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| E1 | Topo | `PageHeader` pequeno | Capa com foto do UAIventura (já tem acervo) + título display | Alto | Médio |
| E2 | Estado vazio | Caixinha "Nenhum evento aberto agora" no meio de uma tela preta — **hoje é o pior estado vazio do site** | Virar página inteira: foto do evento passado + "o próximo sai no grupo" + CTA de WhatsApp + galeria do que já rolou | Alto | Médio |
| E3 | — | Eventos encerrados desaparecem | Seção "já aconteceu" com os encerrados em escala de cinza, clicáveis. Prova social e SEO | Alto | Médio |
| E4 | Card | Sem contagem regressiva | "Faltam 12 dias" em âmbar no card | Médio | Baixo |

---

### 2.7 Evento — detalhe (`/eventos/[slug]`)

| ID | Seção | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| ED1 | Capa | Sangrar o banner, título sobre a imagem, data em bloco de calendário desenhado | Alto | Médio |
| ED2 | Ingressos | Cartões com picote de ingresso (reaproveitar o do card de mesa), preço em display, "restam N" em âmbar | Alto | Médio |
| ED3 | Ingressos | Barra de lotação ("28 de 38 lugares") com preenchimento animado | Alto | Baixo |
| ED4 | Mesas do evento | Grade com as mesas vinculadas, hoje discreta — dar o mesmo peso dos ingressos | Médio | Médio |
| ED5 | Local | Mapa estático ou ilustração do local, em vez de só texto | Médio | Médio |
| ED6 | Fim | Encerrar com FAQ do evento + comunidade | Médio | Baixo |

---

### 2.8 Presencial BH (`/presencial-bh`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| P1 | Herói | Foto aérea de BH com título — **é o melhor herói do site hoje** | Manter; adicionar parallax e escurecer menos a foto | Médio | Baixo |
| P2 | "Como funciona" | Caixa de texto corrido, cinza, fácil de pular | Virar 3 passos numerados com ícone (publicar → combinar → jogar) | Alto | Baixo |
| P3 | Grade | Mesmo problema das outras listas: 1 card e sobra | G25 + bloco de fechamento | Alto | Baixo |
| P4 | CTA | "Criar minha mesa presencial" no topo, some ao rolar | Repetir no fim da página, em bloco grande | Médio | Baixo |
| P5 | — | Nada mostra que é BH de verdade | Linha de bairros/locais onde já rolou mesa | Médio | Médio |

---

### 2.9 Sobre (`/sobre`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| SO1 | Capa | Foto de mesa com título sobreposto — boa | Aumentar pra 50vh e dar parallax | Médio | Baixo |
| SO2 | Texto de abertura | Dois parágrafos em caixa cinza | Tirar da caixa: texto grande (20px), largura de leitura, lettra capitular | Médio | Baixo |
| SO3 | "Três frentes" | Três cards iguais, ícone pequeno | Ícones grandes (48px) em âmbar, número romano/d20 por frente, hover com brilho | Alto | Baixo |
| SO4 | "Segurança em primeiro lugar" | Caixa cinza, mesmo peso das outras | Destacar: é diferencial de verdade. Painel-alto, ícone de escudo grande, borda em verde | Alto | Baixo |
| SO5 | "Quem sou eu" | Avatar redondo 80px + texto | Foto grande (240px) à esquerda sangrando, texto à direita, assinatura manuscrita embaixo | Alto | Médio |
| SO6 | Sistemas | Linha de texto com nomes separados por ponto | Logos dos sistemas em linha (já existem em `LOGO_SISTEMA`) | Alto | Baixo |
| SO7 | CTAs finais | Três botões lado a lado, mesmo peso | Hierarquia + bloco de comunidade com brilho | Médio | Baixo |

---

### 2.10 Links (`/links`)

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| L1 | Logo 64px + título + lista de 7 botões, centralizada | É link-in-bio: tem que ser a página **mais** bonita do site, porque é a primeira que o público do Instagram vê. Fundo com gradiente animado + d20 | Alto | Médio |
| L2 | Botões todos iguais, menos o primeiro | Cada link com sua cor de marca (WhatsApp verde, Instagram rosa, YouTube vermelho) em borda/ícone | Alto | Baixo |
| L3 | Sem foto | Avatar do Quintão no topo, grande e redondo com anel em gradiente | Alto | Baixo |
| L4 | Sem prova de atividade | Faixa "última tabela publicada: X" puxada do banco | Médio | Médio |
| L5 | Header e rodapé completos do site aparecem | Nesta página, esconder o header e usar rodapé mínimo — link-in-bio tem que ser tela limpa | Alto | Baixo |
| L6 | ⚠️ **Verificar**: no meu navegador a página renderizou só o logo; o HTML do servidor está correto, pode ter sido o painel do app | Abrir no seu navegador e me dizer se aparece a lista | — | — |

---

### 2.11 Entrar / criar conta (`/entrar`)

| ID | Seção | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|---|
| A1 | Layout | Duas colunas (texto + formulário) no alto, resto da tela vazio | Tela cheia: coluna esquerda com foto de mesa sangrando, direita com o formulário centralizado verticalmente | Alto | Médio |
| A2 | Benefícios | Três linhas com ✓ cinza | Ícones em âmbar, texto maior | Médio | Baixo |
| A3 | Abas | "Entrar / Criar conta" discretas | Abas com fundo deslizante animado | Médio | Baixo |
| A4 | Campos | `Input` padrão | Rótulo flutuante, foco com anel em gradiente | Médio | Médio |
| A5 | Erro | Mensagem simples | Caixa com ícone e cor de erro consistente | Baixo | Baixo |
| A6 | — | Nenhuma indicação de força de senha no cadastro | Medidor de força | Baixo | Baixo |

---

### 2.12 Conta (`/conta`)

| ID | Seção | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| C1 | Topo | Capa de perfil com banner (já existe `banner-upload`) + avatar sobreposto, estilo rede social | Alto | Médio |
| C2 | Seções | Hoje são blocos empilhados — virar abas ou navegação lateral grudenta | Médio | Médio |
| C3 | Minhas mesas | Cards com estado colorido (aguardando = âmbar, aprovado = verde) | Alto | Baixo |
| C4 | Ingressos | Mostrar como ingresso de verdade, com picote e QR | Alto | Médio |
| C5 | Vazio | Estados vazios com caminho ("você ainda não se candidatou → ver mesas") | Médio | Baixo |

---

### 2.13 Painel da mesa (`/mesas/[slug]/painel`)

| ID | Seção | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| PN1 | Topo | Cabeçalho com a capa da mesa em faixa fina e as abas (Elenco / Sessões / Anotações) | Alto | Médio |
| PN2 | Navegação | Abas com indicador deslizante e contador por aba | Médio | Baixo |
| PN3 | Elenco | Cards de entidade com moldura de ficha (G13) e a cor da visibilidade no fio (vermelho/azul/verde, como já é a convenção) | Alto | Médio |
| PN4 | Elenco | Avatar/ilustração por entidade, mesmo que gerado | Alto | Médio |
| PN5 | Sessões | Linha do tempo vertical com marco por sessão, em vez de lista | Alto | Médio |
| PN6 | Vazio | Estados vazios ilustrados ("nenhum NPC ainda — crie o primeiro") | Médio | Baixo |
| PN7 | — | Nada dá sensação de "mesa viva" | Faixa com próxima sessão e contagem regressiva | Alto | Médio |

---

### 2.14 Páginas legais (`/termos`, `/privacidade`, `/reembolso`, `/licenca-de-uso`)

| ID | O que fazer | Impacto | Esforço |
|---|---|---|---|
| LG1 | Capa fina com título em display e data de atualização em destaque | Médio | Baixo |
| LG2 | Sumário lateral grudento com as seções (só desktop) | Médio | Médio |
| LG3 | Largura de leitura travada, parágrafos numerados | Médio | Baixo |
| LG4 | Navegação entre as 4 legais no fim, em vez de só "voltar pro início" | Baixo | Baixo |

---

### 2.15 Header, rodapé e navegação

| ID | O que está hoje | O que fazer | Impacto | Esforço |
|---|---|---|---|---|
| NAV1 | Header com blur, logo, 5 links, botão | Encolher ao rolar (altura 64→52px) e ganhar sombra | Médio | Baixo |
| NAV2 | Link ativo com sublinhado fino | Indicador deslizante animado entre itens | Médio | Médio |
| NAV3 | Botão "Entrar" igual aos outros | Manter em gradiente, mas com brilho no hover | Baixo | Baixo |
| NAV4 | Menu móvel: sheet padrão | Tela cheia, itens grandes com stagger e ícone por item | Alto | Médio |
| NAV5 | Rodapé: 4 colunas de texto cinza, muito apagado | Logo grande, textura de d20, CTA de WhatsApp em destaque, redes com ícone colorido | Alto | Médio |
| NAV6 | Sem busca | Busca global (mesas + suplementos) no header — fica pra quando houver volume | Baixo | Alto |
| NAV7 | `not-found` e `error` genéricos | Página 404 com d20 "rolou 1" e caminhos de volta | Médio | Baixo |
| NAV8 | ✅ **Feito** — favicon cortado no Google | Ver 2.16 abaixo | Alto | Baixo |

---

### 2.16 Favicon e ícones de marca ✅ feito em 27/10/2026

**O problema:** o Google recorta o favicon num **círculo**. A arte original
(`icon.png`, 256×256) ocupava o quadrado inteiro — medindo, ela chegava a
**101,2% do raio** do círculo inscrito. Ou seja, a moldura do d20 era
literalmente cortada, e o corte circular descartava **21,5% da área** da
imagem. Era isso que aparecia na busca.

**O que foi feito:**

| ID | Item | Antes | Depois |
|---|---|---|---|
| IC1 | Área de respiro | arte a 101,2% do raio (cortada) | arte a **86% do raio**, d20 inteiro dentro do círculo |
| IC2 | Tamanho do favicon | 256×256 (não é múltiplo de 48, que é o que o Google pede) | **192×192** (48 × 4) |
| IC3 | `/favicon.ico` | não existia — navegador e robô que pedissem direto levavam 404 | **existe**, com os quadros 16/32/48 em RGBA |
| IC4 | Ícone da Apple | não existia | **`apple-icon.png` 180×180**, com margem menor (90%), porque o iOS usa máscara de quadrado arredondado, não círculo |
| IC5 | PWA / Android | um ícone de 256, sem `maskable` | **512×512** declarado como `any` e `maskable` (a folga de 86% já satisfaz os 80% exigidos) |
| IC6 | Emenda do fundo | — | o gradiente de fundo foi **estendido a partir do perfil de cor real** da arte original, então não há emenda: maior salto de canal medido = 3/255, invisível |

**Como foi feito sem redesenhar o logo:** a arte original foi reduzida e
recolocada sobre um gradiente reconstruído a partir das próprias cores dela
(o gradiente é horizontal puro, e as colunas das bordas são uniformes — por
isso a emenda some). O monograma "5D" não foi tocado.

**O que ainda depende do Google:** o favicon da busca só troca quando o
Googlebot rastreia o site de novo — costuma levar de alguns dias a algumas
semanas. Dá pra acelerar pedindo reindexação da home no Search Console.

---

### 2.17 Paginação ✅ feito em 27/10/2026

**O problema:** o projeto não tinha paginação em lugar nenhum — zero chamadas
`.range()` no código todo. Toda listagem puxava a tabela inteira e renderizava
tudo de uma vez, no site e no admin.

| ID | Onde | Como |
|---|---|---|
| PG1 | Componente `Paginacao` | Links de verdade (funciona sem JS, o Google rastreia as outras páginas, o botão voltar funciona), janela com reticências, preserva os filtros da URL, e a página 1 não carrega `?pagina=1` — o endereço canônico fica limpo |
| PG2 | `/suplementos` · `/mesas` · `/presencial-bh` | 12 por página, fatiado em memória: os filtros precisam do conjunto inteiro pra saber que sistema e tipo existem de verdade |
| PG3 | `/eventos` | 12 por página, `.range()` no banco com `count: "exact"` — essa lista não alimenta filtro nenhum |
| PG4 | `/admin/eventos/[id]` | 25 pedidos de ingresso por página, `.range()` no banco. Era a lista mais urgente: um evento já passou de trinta. O total no título é o do evento, não o da página, e o botão de exportar continua puxando tudo |
| PG5 | `/admin/usuarios` | 25 por página, no cliente — a busca varre todo mundo, não só a página aberta, então paginar no servidor quebraria a busca |
| PG6 | Contagem | `/mesas` e `/suplementos` mostram "N resultados" acima da grade |

**O que falta:** as listas de `/admin/mesas`, `/admin/suplementos`,
`/admin/eventos` e `/conta` continuam sem paginação. São poucas linhas hoje e
nenhuma cresce sozinha, mas entram na mesma receita quando crescerem. E quando
o catálogo público ficar grande, `/suplementos` e `/mesas` devem trocar a
fatia em memória por `.range()` mais uma consulta separada pros filtros.

---

### 2.18 Imagens reais ✅ primeira leva em 27/10/2026

| Arquivo | Onde está sendo usado |
|---|---|
| `brand/capivara-aventureiro.webp` | Herói do `/presencial-bh` — virou o rosto da página |
| `eventos/uaiventura-salao.webp` | Fundo do estado vazio de `/eventos` |
| `eventos/uaiventura-mesa-escudo.webp` | Ainda não usada |
| `eventos/uaiventura-mesa-arkham.webp` | Ainda não usada |
| `eventos/uaiventura-mesa-mapa.webp` | Ainda não usada |
| `eventos/uaiventura-miniaturas.webp` | Ainda não usada — **é a única sem rosto identificável** |

Todas convertidas pra webp (fotos a 1600px/q78, ilustração a 1080px/q92).

**Onde as não usadas entram:** `E3` (galeria "já aconteceu"), `SO1`/`SO5`
(capa e bloco do `/sobre`), `M1`/`S1` (capas de página) e as capas de fallback
dos cards — ou seja, lotes B e D.

**Um ponto a resolver antes de publicar as fotos com pessoas:** as quatro
fotos de mesa têm rostos identificáveis. Você é o organizador e as fotos são
suas, então a decisão é sua — mas o caminho limpo é um aviso de uso de imagem
nos termos do evento, ou preferir os enquadramentos mais abertos. A de
miniaturas não tem essa questão e pode ir pra qualquer lugar.

---

## Parte 3 — Ordem sugerida

Agrupei por "o que dá mais diferença por hora gasta".

### Lote A — a base que muda tudo (nada depende de arte sua)
`G1 G2 G6 G7 G9 G11 G16 G18 G25 NAV1 NAV5 H3 H6 H7 M5 M7 S7 E2`

Resultado esperado: toda página abre colorida, com título grande, conteúdo
entrando em cascata e nenhuma tela terminando em preto vazio. **É aqui que
você vai sentir a diferença que faltou na rodada passada.**

### Lote B — capas e heróis
`M1 S1 E1 MD2 MD3 MD4 SD1 SD2 ED1 SO1 L1 L3 L5 A1`

Toda página de lista e detalhe passa a abrir com imagem, e os títulos vão pra
cima da capa.

### Lote C — os blocos que vendem
`MD6 MD7 MD9 SD5 SD6 ED2 ED3 M9 SO4 SO5 SO6 H19`

Cartão de ingresso, teatro do dado e os blocos de confiança ganham peso.

### Lote D — refinamento e identidade
`G10 G12 G13 G14 G20 G17 H8 H17 H18 P2 C1 C4 PN1 PN3 PN5 NAV4 NAV7`

Cor por sistema, moldura de ficha, transição de página, linha do tempo.

### Lote E — depende de você
`H11 S4` 🔒 capas dos suplementos · `E3` fotos dos eventos passados ·
`SO5` foto grande do Quintão · `P5` lista de locais

---

## O que eu recomendo cortar

Pra ser honesto sobre custo-benefício:

- **NAV6 (busca global)** — caro e sem volume de conteúdo que justifique hoje.
- **G17 (transição de página com morph de capa)** — bonito, mas frágil no
  Next/App Router e o ganho é menor que o de um bom herói.
- **C2 (abas na conta)** — a página não está grande o bastante pra precisar.

---

## O que **não** fazer

Registro do que já testamos e não funcionou, pra não voltarmos:

- Ornamento genérico entre seções (losango/fio no meio). Ficou pior justamente
  onde o fundo troca de cor. Se voltar, tem que ser com o d20 e sem atravessar
  troca de fundo (G14).
- Degradê de "fade" no topo/base das seções com fundo diferente — mesma
  armadilha.
