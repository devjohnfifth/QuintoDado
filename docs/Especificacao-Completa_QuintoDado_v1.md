# Quinto Dado — Especificação Completa

**Versão 1.0 · 06 de setembro de 2026**
Documento único e consolidado. Reúne visão, regras de negócio, arquitetura, modelo de dados, conteúdo, jurídico e roadmap.

---

## 0. Como usar este documento

Este é o documento-mãe. Os outros três arquivos derivam dele:

| Arquivo | Para quê |
|---|---|
| `Especificacao-Completa_QuintoDado_v1.md` | Este. Fonte da verdade. Leitura humana. |
| `Modelo-de-Dados_QuintoDado_v1.sql` | Schema executável, com RLS. Vai para `supabase/migrations/`. |
| `CLAUDE_QuintoDado_v1.md` | Versão curta para o Claude Code ler a cada sessão. Vira `CLAUDE.md` na raiz. |
| `Textos_QuintoDado_v1.md` | Copy da home, `/sobre`, `/links` e metadados de SEO. |

Regra de manutenção: **se o código divergir deste documento, o documento é que está errado.** Corrija aqui primeiro, depois no código. Um documento que ninguém atualiza vira ficção em três semanas.

---

## 1. Contexto e visão

### 1.1 O que é

**Quinto Dado** é o site pessoal e a plataforma de João Quintão, mestre de RPG brasileiro conhecido como Mestre Quintão. Não é um marketplace. É o site de uma pessoa que, além de se apresentar, vende mesas e distribui material autoral.

Três pilares:

1. **Vitrine** — hub de links, apresentação, prova social. Converte quem chega do Instagram e do TikTok.
2. **Suplementos** — biblioteca de material de RPG autoral, freemium, com peças interativas jogáveis no navegador. É o motor de aquisição orgânica.
3. **Mesas** — venda e gestão de mesas comissionadas. Hoje só do admin; futuramente de mestres convidados.

### 1.2 O que não é

- **Não é um marketplace aberto.** Nenhum mestre se cadastra sozinho e publica. Fase 1: só o admin. Fase 2: convidados aprovados manualmente.
- **Não substitui o MesaQuest.** Convivem. O MesaQuest capta público novo; o site próprio é o destino de quem já conhece a marca. Algumas mesas continuam lá.
- **Não é uma rede social.** Não há feed, não há mensagens diretas, não há timeline. A comunidade vive no WhatsApp.
- **Não é um VTT.** As mesas acontecem no Discord + Foundry. O site vende e organiza; não joga.

### 1.3 Posicionamento

O diferencial não é preço nem catálogo — é **autoria e cuidado**. Duas coisas sustentam isso no produto:

- **Conteúdo interativo.** Uma tabela de encontros que se rola no navegador vale mais, para o visitante e para o Google, do que o mesmo PDF que todo mundo publica.
- **Ferramentas de segurança levadas a sério.** Linhas e véus como pergunta obrigatória em toda mesa, classificação etária real e aplicada. É sinal de mestre sério e é o que diferencia de quem só quer vender vaga.

---

## 2. Quem é o Quinto Dado

Dados apurados do perfil público no MesaQuest, usados como seed do banco e base dos textos:

| Campo | Valor |
|---|---|
| Nome | João Quintão |
| Marca | Quinto Dado |
| Alcunha | Mestre Quintão |
| Instagram | @quintodado |
| MesaQuest | `mestre-quintao-quinto-dado-h0pbv4vz` |
| Idiomas | Português (Brasil) e Inglês (EUA) |
| Tags de perfil | Streamer · Multilíngue · Worldbuilder |
| Reputação | 5.0 · 7 recomendações |
| Sistemas | Ordem Paranormal / OP2, Tormenta 20, Vaesen, Fabula Ultima, Daggerheart, Sacramento RPG |
| Formato | One-shots online |
| Ferramentas | Discord + Foundry VTT |
| Preço praticado | R$ 35 a R$ 40 por sessão |
| Volume | ~8 mesas pagas/mês · comunidade de ~20 pessoas no WhatsApp |
| Produção | 1 suplemento/semana |
| Equipe | 1 pessoa, com perfil técnico de TI |

**Três consequências disso para o projeto:**

1. **A bio já é o pitch do site.** Ele escreve que ama fazer "um cardápio de uma taverna ou um mapa interativo" — que é literalmente a proposta do módulo de suplementos. O site materializa o que ele já diz que faz.
2. **Todas as mesas são one-shots de R$35–40.** Campanha, mensalidade e cobrança recorrente são casos que ele ainda não usa. Não gaste semana de Alfa neles.
3. **Ele já anuncia mesas em inglês.** O site nasce em pt-BR, mas o inglês vai chegar. Isso condiciona a estratégia de URL (§16).

### 2.1 Escala e o que ela implica

Oito mesas por mês, vinte pessoas no grupo, um suplemento por semana. **Nenhuma decisão de arquitetura precisa antecipar escala.** Um Next.js monolítico com um Postgres aguenta cem vezes esse volume sem suar. Nada de filas, microserviços, cache distribuído ou multi-tenant.

A escalabilidade exigida está em outro lugar: no **modelo de dados** (que precisa suportar mestres convidados, split, assinatura e inglês sem migração destrutiva) e nas **regras de negócio** (que precisam estar corretas desde o primeiro dia, porque erro em dinheiro e em dado de menor de idade não tem desfazer).

---

## 3. Objetivos e métricas

**Objetivo primário dos primeiros 6 meses: construir audiência.** Receita é secundária nesta fase.

Em qualquer dúvida de escopo, decida a favor do que aumenta: visitas orgânicas → cadastros → entradas no grupo de WhatsApp.

| Métrica | Como medir | Meta de referência (6 meses) |
|---|---|---|
| Visitas orgânicas/mês | Cloudflare Web Analytics | crescimento consistente mês a mês |
| Cadastros | `profiles` | 300 |
| Entradas no grupo | clique no link + contagem manual | 150 |
| Downloads de suplementos | `downloads` | 1.000 |
| Conversão visita → cadastro | eventos | 5% |
| Conversão view de mesa → candidatura | eventos | 8% |
| Taxa de ocupação das mesas | aprovados / vagas | 70% |
| Receita mensal | `pagamentos` | manter os ~R$300/mês atuais e crescer |

Note que **nenhuma métrica primária é de receita**. Isso é deliberado e deve orientar os cortes de escopo.

---

## 4. Personas e jornadas

### 4.1 Mestre buscando material (persona de aquisição)

*Está montando a sessão de sábado, precisa de uma tabela de encontros para uma estrada à noite. Digita no Google.*

É a **única persona que chega sem conhecer a marca**. É por isso que SEO e conteúdo gratuito são o motor de audiência, e por isso a tabela interativa importa tanto: ela transforma uma busca de cauda longa em uma página útil, indexável e memorável.

Jornada: Google → página do suplemento → rola a tabela ali mesmo → quer baixar → cria conta → vê que tem material novo toda semana → entra no grupo.

### 4.2 Seguidor curioso

*Viu um Reels, clicou no link da bio.*

Jornada: Instagram → `/links` → entra no grupo ou vê `/sobre`. A página `/links` precisa carregar em menos de um segundo no 4G e ter o WhatsApp em primeiro lugar.

### 4.3 Jogador procurando mesa

*Quer jogar Ordem Paranormal, nunca jogou com esse mestre.*

Jornada: home ou Instagram → `/mesas` → detalhe → candidatura → paga → aguarda aprovação → recebe briefing com o grupo da mesa.

O que ele precisa ver antes de decidir: sinopse, sistema, preço, data, se é para iniciantes, e sinal de que o mestre é cuidadoso (linhas e véus, classificação etária, avaliações).

### 4.4 Admin (você)

*Acabou de fechar um one-shot novo, quer publicar em cinco minutos.*

O painel precisa ser rápido, não bonito. Criar mesa, subir suplemento, aprovar inscrição, mandar briefing. Se levar mais de cinco minutos para publicar uma mesa, o admin volta a usar o MesaQuest.

### 4.5 Mestre convidado (Fase 2)

*Foi convidado, quer publicar mesa e receber.*

Não existe no Alfa nem na v1. O modelo de dados o comporta; a interface, não.

---

## 5. Registro de decisões

Decisões fechadas em 06/09/2026. Alterar qualquer uma destas exige revisar o impacto listado.

| # | Decisão | Motivo | Impacta |
|---|---|---|---|
| D1 | Comissão de **0%** na faixa R$5,00–9,99 (só taxa do gateway) | Fechar o buraco na tabela de faixas | `faixas_comissao` |
| D2 | **Termo do responsável** (nome, CPF, e-mail confirmado) para menor de 18 em mesa paga | Menor de 16 é absolutamente incapaz de contratar; 16–18 é relativamente incapaz | `consentimentos_responsavel`, fluxo de inscrição |
| D3 | **pt-BR na v1**, com rotas preparadas para inglês; português na raiz, sem prefixo | Evitar 301 em massa quando o inglês entrar | `next-intl`, todas as rotas |
| D4 | Repasse liberado **24h após o fim da sessão**, via split do gateway | Retenção financia estornos; 7 dias era atrito sem proteção | `repasses.liberar_em` |
| D5 | **Alfa sem pagamento integrado** — Pix combinado manualmente | Viabilizar site no ar em 1 semana | Roadmap |
| D6 | **Pix apenas** na v1; cartão e recorrência na Fase 2 | Simplicidade e taxa | Integração de gateway |
| D7 | Mestres de terceiros **só na Fase 2**, com split obrigatório | Evitar intermediação de pagamento por pessoa física | Módulo de repasses |
| D8 | Tema **escuro** como padrão, mobile-first | Público e identidade da marca | Design system |
| D9 | Sem newsletter | O grupo de WhatsApp já cumpre o papel | Home |
| D10 | Sem lista de espera em mesas | Volume não justifica | Módulo de mesas |

### 5.1 Os três conflitos que existiam no briefing

**Conflito A — retenção de dinheiro de terceiros × pessoa física.** O briefing pedia comissão progressiva e retenção de 7 dias antes do repasse ao mestre. Reter para depois repassar coloca o operador como intermediador de pagamentos: o valor cheio pode ser lido como receita própria, e surge responsabilidade solidária pelo serviço do outro mestre (CDC art. 7º, parágrafo único).

Resolvido por D4 e D7. A retenção **não foi eliminada** — ela é o que financia os estornos. Se o mestre recebe no ato e o jogador cancela com 40h de antecedência tendo direito a 50%, o reembolso sairia do bolso da plataforma. O que mudou foi o prazo (de D+7 para 24h após a sessão, porque depois da sessão não resta cenário de reembolso previsto) e o custodiante (o split do gateway, não a conta pessoal).

**Conflito B — idade mínima de 14 × mesa paga.** Pelo Código Civil, menor de 16 é absolutamente incapaz de contratar (art. 3º) e entre 16 e 18 é relativamente incapaz (art. 4º). Um jogador de 14 anos não pode contratar sozinho uma mesa paga. Resolvido por D2.

**Conflito C — faixas de comissão com buraco.** A tabela original pulava de "mínimo R$5" para "entre 10 e 20", deixando R$5–9,99 indefinido, e os limites eram ambíguos. Resolvido por D1 e pela tabela do §12.2.

---

## 6. Escopo por fase

### Alfa — semana 1
Site no ar, captando audiência, **sem pagamento integrado**.

Home · `/links` · `/sobre` · auth com papéis e gating etário · catálogo de suplementos gratuitos · uma tabela aleatória interativa · `/mesas` com candidatura sem pagamento · admin mínimo · SEO base · páginas legais em rascunho.

### v1 estável — semanas 2 e 3
Pix via gateway · máquina de estados completa da inscrição · estorno automático · briefing pós-aprovação · consentimento de responsável · suplementos pagos com marca d'água · kits · `/apoie` · notificações · métricas.

### Fase 2 — depois
Mestres convidados com split · avaliações mútuas · blog · lembretes automáticos de sessão · calendário com fuso · cartão e recorrência · candidatura pública a mestre · assinatura · inglês · internacional.

**Fora de escopo indefinidamente:** app nativo, chat interno, VTT próprio, fórum, marketplace aberto.

---

## 7. Arquitetura de informação

```
/                        Home
/links                   Hub de links (destino da bio do Instagram)
/sobre                   Quem é o Quinto Dado
/suplementos             Catálogo + filtros
/suplementos/[slug]      Detalhe: preview, tabela interativa, download
/suplementos/sistema/[s] Cauda longa por sistema
/suplementos/tipo/[t]    Cauda longa por tipo
/kits/[slug]             Kit temático
/mesas                   Vitrine de mesas + filtros
/mesas/[slug]            Detalhe + candidatura
/u/[username]            Perfil público
/conta                   Minha área
/conta/inscricoes/[id]   Status, pagamento, briefing
/conta/downloads         Histórico
/conta/dados             LGPD: exportar e excluir
/apoie                   Doação Pix
/termos /privacidade /reembolso /licenca-de-uso
/admin/*                 Painel

/blog                    [Fase 2]
/mestres                 [Fase 2]
/en/*                    [Fase 2]

sitemap.xml · robots.txt · rss.xml
```

---

## 8. Módulo A — Vitrine

### 8.1 Home

Sete blocos, nesta ordem:

1. **Herói** — logo, tagline, dois CTAs: *Entrar na comunidade* (WhatsApp) e *Ver mesas abertas*.
2. **Links rápidos** — WhatsApp do grupo, Instagram, TikTok, YouTube, MesaQuest. Fonte única na tabela `links`, ordenável pelo admin, compartilhada com `/links`.
3. **Apresentação curta** com link para `/sobre`.
4. **Mesas abertas** — até 3 cards. O bloco desaparece se não houver nenhuma.
5. **Últimos suplementos** — até 6.
6. **Prova social** — carrossel de depoimentos e embeds de vídeo (YouTube/TikTok). Tabela `depoimentos`, com campo de origem.
7. **Rodapé** com links legais e disclaimer de marcas.

Sem newsletter (D9).

### 8.2 `/links`

Página minimalista, otimizada para 4G, sem imagens pesadas. Ordem sugerida (mais convertem primeiro):

1. Entrar na comunidade — WhatsApp
2. Mesas abertas
3. Material gratuito
4. Instagram · 5. TikTok · 6. YouTube
7. Perfil no MesaQuest
8. Apoiar o projeto

### 8.3 `/sobre`

Bio longa, sistemas que mestra, como conduz as mesas (incluindo a menção a linhas e véus), o que produz, e três CTAs no fim. Texto pronto em `Textos_QuintoDado_v1.md`.

---

## 9. Módulo B — Contas, papéis e gating etário

### 9.1 Autenticação

Google, Discord e e-mail+senha, via Supabase Auth. Discord é o mais natural para o público de RPG e deve aparecer primeiro.

Cadastro coleta: nome de exibição, username (slug único), **data de nascimento** (obrigatória) e aceite dos termos com versão e timestamp.

### 9.2 O que a conta destrava

Baixar suplementos gratuitos · favoritar · se candidatar a mesas · ver histórico. Visitante anônimo navega e lê tudo o que for `livre` ou `14`, mas não baixa nem se inscreve.

### 9.3 Papéis

`visitante` (sem conta) · `usuario` · `mestre` · `admin`. Coluna `papel` em `profiles`, verificada por RLS — nunca só no front.

A **candidatura a mestre existe no código mas nasce desligada** por feature flag (`FEATURE_CANDIDATURA_MESTRE=false`). No Alfa e na v1, promoção a mestre é ação manual do admin.

### 9.4 Perfil público

`/u/[username]`: avatar, bio, sistemas favoritos, mesas que mestra. O usuário escolhe se o perfil é público ou privado (`perfil_publico`).

### 9.5 Gating etário

Cada mesa e cada suplemento tem `classificacao` ∈ {`livre`, `14`, `16`, `18`}.

| Idade do usuário | Vê |
|---|---|
| Visitante (sem conta) | `livre`, `14` |
| 14–15 | `livre`, `14` |
| 16–17 | `livre`, `14`, `16` |
| 18+ | tudo |

Regras de implementação, todas obrigatórias:

- O filtro roda **no servidor** e é reforçado por **policy de RLS**. Nunca apenas no front.
- Conteúdo fora da faixa não aparece em listagem, **nem por URL direta**, nem no sitemap.
- Conteúdo `18` fica **fora do sitemap** sempre.
- A função `classificacoes_permitidas()` no banco é a fonte única dessa regra.

Esta é a regra mais fácil de quebrar por descuido e a de consequência mais séria. Teste com um usuário de 14 anos toda vez que mexer em listagem ou em rota dinâmica.

---

## 10. Módulo C — Suplementos

### 10.1 Tipos e taxonomia

**Tipos:** tabela de encontros · tabela de loot · mapa · arte · homebrew · aventura/one-shot pronta · ficha · token · módulo de VTT.

**Filtros:** sistema · tipo · estilo/tema (terror, alta fantasia, investigação, urbano…) · nível/tier · gratuito ou pago · formato de arquivo · idioma.

**Formatos:** PDF, PNG/JPG/WEBP, JSON/ZIP de VTT (Foundry, Roll20). Limite de 100 MB por arquivo.

### 10.2 Conteúdo interativo — o diferencial

Tabelas aleatórias **não são armazenadas como PDF**. São dados estruturados:

- `tabelas_aleatorias`: dado (d20/d66/d100), colunas, quantos itens ficam visíveis sem comprar.
- `tabela_itens`: faixa de resultado → valores (um por coluna), com suporte a tabela aninhada.

Disso saem três coisas:

1. **Rolagem no navegador**, com resultado destacado, histórico da sessão e botão "rolar tudo" para tabelas aninhadas.
2. **PDF gerado sob demanda** a partir dos mesmos dados. Uma fonte, duas saídas — nunca um PDF desatualizado convivendo com a versão do site.
3. **Texto indexável na página.** Uma tabela renderizada como HTML vale mais para o Google do que dez PDFs.

### 10.3 Kits

Agrupamento curado por sistema + tema — ex.: "Kit Ordem Paranormal 2 — Ritualística Urbana". Pode ser gratuito ou pago. Um suplemento pertence a vários kits.

### 10.4 Preview de item pago

Obrigatório. Uma das três formas: primeiras N linhas da tabela visíveis (`itens_livres`), páginas de amostra do PDF (`arquivos_suplemento.eh_preview`), ou versão do mapa em baixa resolução com marca d'água diagonal.

Preview reduz drasticamente pedido de reembolso, que é o que torna a política generosa do §12.4 sustentável.

### 10.5 Marca d'água e rastreio

| | Gratuito | Pago |
|---|---|---|
| Nome e e-mail no rodapé | ❌ | ✅ |
| Nome e e-mail nos metadados | ❌ | ✅ |
| Marca Quinto Dado no rodapé | ✅ | ✅ |
| Link de download | assinado, 24h | assinado, 15 min |
| Geração | arquivo estático | sob demanda, por comprador |

Implementação: `pdf-lib` numa rota de servidor para PDF, `sharp` para imagem. O arquivo personalizado **não é armazenado** — é gerado no momento do download e descartado.

### 10.6 Licenciamento

**Conteúdo pago:** mínimo possível de IA, restrito a licenças abertas dos sistemas (SRD 5.1 / CC-BY-4.0 para D&D, licença aberta do Tormenta 20, ORC quando aplicável). Os campos `licenca_base` e `atribuicao` são **obrigatórios por constraint no banco** — não é possível publicar item pago sem preenchê-los.

**Conteúdo gratuito:** regra mais solta, mas o campo `usa_ia` é obrigatório e **exibido na página**. Transparência aqui é reputação, e reputação é o ativo do projeto.

**Licença ao usuário:**
- Pago: uso pessoal na própria mesa. Sem redistribuição, sem uso comercial.
- Gratuito: uso pessoal, redistribuição permitida com crédito.

**Marcas de terceiros** (D&D, Tormenta, Ordem Paranormal) aparecem apenas como referência de compatibilidade, com disclaimer no rodapé. Nunca no logotipo, nunca em nome de produto de forma que sugira oficialidade.

---

## 11. Módulo D — Mesas

### 11.1 Anatomia

Campos: `titulo` · `slug` · `banner` · `sistema` · `tipo` (one-shot / aventura fechada / campanha) · `sinopse` · `plataforma_vtt` · `plataforma_voz` · `modalidade` (online / presencial) · `cidade_uf` (obrigatório se presencial) · `tags_tema` · `classificacao` · `nivel_experiencia` · `vagas_total` · `min_jogadores` · `preco` · `modelo_cobranca` · `frequencia` · `qtd_sessoes` · `data_inicio` · `horario_inicio` · `horario_fim` · `fuso` · `idioma` · `mestre_id` · `status`.

Campos sensíveis, tratados no §11.5: `mensagem_boas_vindas`, `whatsapp_mestre`, `link_grupo_wpp`.

### 11.2 Máquina de estados da mesa

```
rascunho → aguardando_aprovacao → publicada → confirmada
         → em_andamento → concluida
                        ↘ cancelada (de qualquer estado)
```

Toda mesa passa por **aprovação prévia do admin** antes de ficar pública. Como só o admin cria mesas na Fase 1, é auto-aprovação de um clique — mas a máquina de estados já fica pronta para quando houver terceiros.

### 11.3 Ficha de inscrição personalizada

Cada mesa define perguntas próprias (texto curto, texto longo, escolha única, escolha múltipla). **Duas perguntas são fixas em toda mesa e não podem ser removidas:**

- **Linhas e véus** — temas que o jogador não quer que apareçam.
- **Experiência com o sistema.**

São marcadas com `fixa = true` e semeadas na criação da mesa.

### 11.4 Fluxo de inscrição

```
1. candidatura_enviada    jogador responde a ficha
2. aguardando_pagamento   recebe cobrança Pix (QR + copia-e-cola, validade 30 min)
3. pago_em_analise        webhook confirma; mestre avalia a candidatura
4a. aprovado              vaga confirmada → dispara briefing
4b. recusado              estorno integral automático em até 24h
5. concluida              após a sessão
```

Estados adicionais: `expirada` (não pagou em 30 min), `cancelada_jogador`, `cancelada_mestre`, `reembolsada`.

**Por que cobrar antes de aprovar:** filtra candidatura sem compromisso, que é o problema real de quem vende mesa. O custo é operacional (estorno quando recusa), e é aceitável porque o estorno de Pix é automatizável.

**Confirmação da mesa:** se `aprovados < min_jogadores` até 24h antes do início, a mesa é **cancelada automaticamente** e todos os pagamentos são estornados integralmente. Job diário.

**Sem lista de espera** (D10).

### 11.5 Briefing pós-aprovação

Ao ser aprovado, o jogador recebe **por e-mail e na plataforma**: saudação do mestre, WhatsApp do mestre e link do grupo de WhatsApp da mesa.

Os campos `mensagem_boas_vindas`, `whatsapp_mestre` e `link_grupo_wpp` **só podem ser servidos a um usuário cuja inscrição esteja `aprovado`**. Isso é regra de servidor e de RLS, não de front-end.

Este é o dado mais sensível do sistema. Nunca deve aparecer em endpoint público, payload de RSC, sitemap ou JSON-LD. É o tipo de coisa que vaza por descuido num Server Component que faz `select *`.

### 11.6 Mesas presenciais

Suportadas. Se `modalidade = 'presencial'`, o campo `cidade_uf` é obrigatório (constraint no banco). Não há mapa nem endereço completo público — o endereço exato vai no briefing, junto com o WhatsApp.

---

## 12. Módulo E — Pagamentos e reembolso

### 12.1 Regras gerais

- **Pix apenas** na v1 (D6).
- Gateway recomendado: **Asaas** (Pix nativo, aceita pessoa física, API de split e de estorno bem documentada). Mercado Pago como alternativa.
- Toda a integração fica atrás de uma interface `PaymentProvider`: `criarCobrancaPix`, `consultarCobranca`, `estornar`, `criarSplit`. Trocar de gateway não deve tocar em regra de negócio.
- **Valores sempre em centavos** (`integer`), com coluna de moeda. Nunca `float`.
- **O webhook é a fonte da verdade.** Nunca confiar no redirect de sucesso. Validar assinatura, registrar em `webhook_eventos`, tratar reentrega como no-op.
- Cobrança Pix expira em 30 minutos.

### 12.2 Comissão da plataforma

| Faixa | Comissão |
|---|---|
| R$ 5,00 – R$ 9,99 | 0% (só a taxa do gateway) |
| R$ 10,00 – R$ 19,99 | 8% |
| R$ 20,00 – R$ 49,99 | 10% |
| R$ 50,00 ou mais | 15% |

Valor mínimo de mesa: R$ 5,00 (constraint no banco). Mesas do admin: comissão 0%.

A tabela vive em `faixas_comissao`, editável sem deploy.

### 12.3 Repasse ao mestre

Liberação **24h após o fim da última sessão**, regra única para admin e para mestres convidados (D4). Na Fase 1, com apenas mesas do admin, o valor cai direto na conta e `liberar_em` serve só de registro.

Na Fase 2, obrigatoriamente via **split nativo do gateway com data de liberação agendada**. O dinheiro nunca transita pela conta pessoal do operador.

⚠️ **Validar antes da Fase 2:** confirme com o gateway se o split de Pix permite agendar a data de liberação do recebedor secundário. Se não permitir, as alternativas são (a) emitir a cobrança apenas nos dias próximos à sessão, encurtando a janela de reembolso, ou (b) split imediato com desconto de estornos em repasses futuros — pior para operação solo. Não implemente a Fase 2 sem essa resposta.

### 12.4 Política de reembolso

Base legal: **CDC art. 49** (arrependimento de 7 dias em compra fora do estabelecimento, inclusive de serviços) e **Código Civil art. 413** (multa compensatória redutível judicialmente se excessiva).

> Não sou advogado. Esta estrutura equilibra conformidade e proteção do mestre, mas **precisa de revisão profissional antes de publicar**.

**Mesas**

| Situação | Reembolso | Automático |
|---|---|---|
| Não aprovado pelo mestre | 100% | Sim, ≤24h |
| Arrependimento: ≤7 dias do pagamento **e** ≥48h antes da sessão | 100% | Sim |
| Cancelamento do jogador com ≥7 dias de antecedência | 100% | Sim |
| Cancelamento do jogador entre 48h e 7 dias | 100% menos taxa do gateway | Sim |
| Cancelamento do jogador com <48h | 50% | Sim |
| No-show sem aviso | 0% | — |
| Mesa cancelada pelo mestre | 100% | Sim |
| Mínimo de jogadores não atingido | 100% | Sim |
| Sessão adiada pelo mestre | crédito ou 100%, escolha do jogador | Manual |

Quando duas regras colidirem, **prevalece a mais favorável ao consumidor**.

**Suplementos pagos.** Reembolso integral em até 7 dias da compra, solicitado pela conta. O download é registrado, mas **o pedido é honrado mesmo com download feito** — disputar R$15 custa mais caro do que devolver. O preview obrigatório (§10.4) é o que mantém a incidência baixa.

**Regra transversal:** toda cobrança exibe a política resumida antes do pagamento, com link para `/reembolso`. Aceite registrado com timestamp e versão do documento.

### 12.5 Doações

Página `/apoie` com Pix de valor livre e sugestões de R$5 / R$15 / R$30. **Sem contrapartida prometida** — doação com contrapartida vira venda e muda o enquadramento fiscal e consumerista.

### 12.6 Preço sugerido para conteúdo pago

Tabela ou peça avulsa **R$7–19** · kit temático **R$19–39** · aventura completa ou módulo de VTT **R$29–59**.

### 12.7 Fiscal

Operação começa como **pessoa física**, com migração para MEI prevista. Nota fiscal está fora do escopo agora, mas `pagamentos` já tem os campos (`nf_numero`, `nf_emitida_em`) para quando for necessário.

---

## 13. Módulo F — Notificações

Canais: **in-app** (sino + lista em `/conta/notificacoes`) e **e-mail** (Resend).

Eventos: nova candidatura (mestre) · pagamento confirmado · aprovado com briefing · recusado com estorno · mesa confirmada · mesa cancelada · reembolso processado · lembrete de sessão.

O lembrete de sessão (24h e 2h antes) é **Fase 2**, mas a tabela `notificacoes` já suporta agendamento via `enviar_em`, então nada precisa ser remodelado depois.

---

## 14. Módulo G — Admin e métricas

### 14.1 Painel mínimo

Criar/editar/publicar mesa · aprovar mesas · subir suplemento (com editor de tabela aleatória) · criar kit · ver e aprovar inscrições · disparar estorno manual · gerir links da home e depoimentos · promover usuário a mestre.

Critério de qualidade: **publicar uma mesa em menos de cinco minutos**. Se demorar mais, o admin volta para o MesaQuest e o site morre.

### 14.2 Métricas na v1

Visitas · downloads por suplemento · cadastros · conversão visitante→cadastro · conversão view de mesa→candidatura · receita do mês · taxa de ocupação das mesas.

Fonte: Cloudflare Web Analytics para tráfego, tabela `eventos_analytics` para eventos de produto.

---

## 15. SEO

Prioridade alta. É o canal de aquisição da persona 4.1.

- **Renderização no servidor** em todas as páginas públicas. Nada de conteúdo importante só no cliente.
- `metadata` por página; Open Graph com imagem gerada dinamicamente (Satori / `@vercel/og`) para mesas e suplementos.
- **JSON-LD**: `Event` para mesas, `Product` + `Offer` para suplementos pagos, `Person`/`Organization` na home, `BreadcrumbList` nas internas.
- Slugs legíveis e permanentes; 301 se mudar.
- `sitemap.xml` dinâmico **respeitando o gating etário** (18+ nunca entra), `robots.txt`, feed RSS de suplementos.
- **Páginas de cauda longa** por sistema e por tipo — é o que captura busca do tipo "tabela de encontros ordem paranormal".
- Core Web Vitals: WEBP/AVIF via `next/image`, fontes locais, zero layout shift.
- Metadados prontos em `Textos_QuintoDado_v1.md`.

Insight que orienta tudo: **uma tabela aleatória renderizada como texto na página vale mais que dez PDFs.** PDF não indexa bem, não engaja e não gera link.

---

## 16. Idioma e internacionalização

v1 **só em pt-BR** (D3), mas com as rotas preparadas.

**Estratégia de URL — a decisão que importa:** português fica **na raiz, sem prefixo** (`/mesas`), e o prefixo `/en` fica reservado (`/en/tables`). A alternativa (`/pt/mesas`) obrigaria a redirecionar com 301 toda URL já indexada no dia em que o inglês entrasse — perda de autoridade sem necessidade.

Implementação: `next-intl` com `localePrefix: 'as-needed'` e `defaultLocale: 'pt-BR'`.

**Regra dura:** nenhum texto de interface embutido no JSX, desde o primeiro commit. Tudo em arquivo de mensagem. É trabalho pequeno agora e caríssimo depois.

No banco, `mesas` e `suplementos` têm coluna `idioma` desde já, porque **a mesa em inglês é um registro próprio, não uma tradução** do mesmo registro. Tradução de páginas institucionais fica para quando o inglês entrar.

Quando o inglês existir: `hreflang` recíproco em todas as páginas equivalentes, com `x-default` apontando para pt-BR.

---

## 17. Modelo de dados

Schema executável completo em `Modelo-de-Dados_QuintoDado_v1.sql`. Visão geral:

**Identidade:** `profiles` (com `papel`, `data_nascimento`, `perfil_publico`)
**Taxonomia:** `sistemas`, `tags`
**Institucional:** `links`, `depoimentos`
**Suplementos:** `suplementos`, `suplemento_tags`, `arquivos_suplemento`, `tabelas_aleatorias`, `tabela_itens`, `kits`, `kit_suplementos`, `compras`, `downloads`, `favoritos`
**Mesas:** `mesas`, `mesa_tags`, `mesa_sessoes`, `mesa_perguntas`, `inscricoes`, `inscricao_respostas`, `consentimentos_responsavel`
**Financeiro:** `pagamentos`, `webhook_eventos`, `faixas_comissao`, `repasses`
**Operacional:** `notificacoes`, `eventos_analytics`, `aceites_termos`, `audit_log`

### 17.1 Funções de apoio no banco

- `idade_de(uid)` — idade em anos completos.
- `classificacoes_permitidas()` — array de classificações que o usuário atual pode ver. **Fonte única do gating etário.**
- `eh_admin()` — usada em quase toda policy.

### 17.2 Regras que vivem na aplicação, não no banco

1. Cálculo de comissão a partir de `faixas_comissao`; mesa do admin = 0%.
2. Expiração de cobrança Pix em 30 min → inscrição vira `expirada`.
3. Recusa do mestre → estorno integral em até 24h.
4. 24h antes do início, se aprovados < mínimo → mesa cancelada + estorno de todos.
5. Escala de reembolso por antecedência (§12.4), sempre com a regra mais favorável ao consumidor.
6. Suplemento pago: reembolso em 7 dias, honrado mesmo com download.
7. Menor de 18 em mesa paga não avança para `aprovado` sem `consentimentos_responsavel.confirmado_em`.
8. Briefing só servido a inscrição `aprovado`.
9. Webhook idempotente.
10. `repasses.liberar_em` = fim da última sessão + 24h.

---

## 18. Stack e infraestrutura

| Camada | Escolha |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| i18n | next-intl (`localePrefix: 'as-needed'`) |
| Banco / Auth / RLS | Supabase (Postgres) |
| Arquivos | Cloudflare R2, URLs assinadas |
| Pagamento | Asaas (Pix) |
| E-mail | Resend |
| Analytics | Cloudflare Web Analytics + `eventos_analytics` |
| Jobs | Cron do provedor → rotas protegidas por token |
| Testes | Vitest (regras de negócio) + Playwright (fluxo de inscrição) |

### 18.1 Hospedagem e o teto de R$50/mês

⚠️ O plano **Hobby da Vercel é destinado a projetos pessoais não comerciais**; um site que vende mesas e suplementos provavelmente exige o plano Pro (~US$20/mês, acima do teto). Verifique os termos atuais antes de decidir.

Duas alternativas dentro do orçamento:

- **Cloudflare Workers + Pages** via OpenNext — tier gratuito permite uso comercial, e o R2 já fica no mesmo lugar dos arquivos. Recomendação principal.
- **VPS (Hetzner CX22, ~R$25/mês) + Coolify** — mais controle, mais manutenção. Boa opção dado o perfil técnico do operador.

**Custo estimado:** domínio `.com.br` ~R$40/ano · Supabase Free · R2 free (10 GB) · Resend Free (3.000 e-mails/mês) · hospedagem R$0–25. **Total dentro dos R$50.**

Atenção: mapas e artes consomem armazenamento rápido. O R2 tem 10 GB grátis e **egresso zero** — por isso ele, e não o Storage do Supabase (1 GB).

### 18.2 Domínio

Sugestões, em ordem: `quintodado.com.br` · `quintodado.com` · `oquintodado.com.br`. Registrar no Registro.br, DNS na Cloudflare.

### 18.3 Convenções de código

- Nomes de tabela, coluna e rota de domínio em **português** (`mesas`, `inscricoes`, `/suplementos`). Código, tipos e utilitários em inglês.
- Server Components por padrão; `"use client"` só quando houver interação.
- Toda mutação passa por Server Action ou Route Handler que **revalida a regra no servidor**. Validação de formulário não é validação.
- Zod para toda entrada externa, incluindo webhook.
- Migrações versionadas em `supabase/migrations/`. Nunca alterar schema pela UI do Supabase.
- Segredos só em variáveis de ambiente.

---

## 19. Identidade visual

Extraída da logo: gradiente **azul → roxo**, monograma "5D" branco, padrão de icosaedro (d20) ao fundo.

```css
--fundo:        #0B0B14;
--superficie:   #14142099;
--primaria:     #4F7DF3;   /* azul da logo */
--secundaria:   #9B5CF6;   /* roxo da logo */
--gradiente:    linear-gradient(135deg, #4F7DF3, #A855F7);
--texto:        #F5F5FA;
--texto-suave:  #A0A0B8;
--sucesso:      #34D399;
--alerta:       #FBBF24;
--erro:         #F87171;
```

**Tipografia:** display com personalidade nos títulos (Cinzel, Sora ou Space Grotesk); sans neutra e legível no corpo (Inter).

**Tratamento:** cantos suaves, superfícies com leve transparência, padrão de d20 como textura discreta de fundo — nunca competindo com o conteúdo.

**Tema escuro é o padrão** (D8). **Mobile-first obrigatório**, com layout desktop trabalhado, não apenas esticado.

**Referências:** MesaQuest e Tavernaria para estrutura. Para tom, algo mais pessoal e autoral que ambos — é o site de uma pessoa, não de um marketplace.

---

## 20. Segurança e privacidade

- **RLS ligado em todas as tabelas.** Negar por padrão, liberar explicitamente. `service_role` só no servidor, jamais no cliente.
- **Dados sensíveis por definição:** WhatsApp do mestre, link do grupo, respostas de linhas e véus, data de nascimento, dados do responsável. Todos com leitura restrita.
- **Arquivos sempre em URL assinada e expirável.** Nenhum bucket público.
- **Rate limit** em candidatura, login e geração de cobrança.
- **LGPD:** página de exclusão de conta e exportação de dados (art. 18), banner de cookies com recusa real, registro de aceite com versão e timestamp.
- **Menores de 18** em mesa paga: fluxo de consentimento do responsável (D2).
- **Auditoria** (`audit_log`) para: mudança de papel, aprovação/recusa de inscrição, estorno, publicação de mesa.

---

## 21. Jurídico

Documentos necessários desde a v1: **Termos de Uso**, **Política de Privacidade**, **Política de Reembolso** e **Licença de Uso do conteúdo**. Rascunhos a serem redigidos e **revisados por advogado antes de publicar**.

**Pontos que exigem atenção profissional:**

1. Enquadramento da atividade como pessoa física e o momento da migração para MEI.
2. Responsabilidade da plataforma pelo serviço de mestres convidados (Fase 2) — CDC art. 7º, parágrafo único, e art. 25 §1º.
3. Contratação por menores de 18 e validade do termo do responsável.
4. Uso de marcas de terceiros e limites das licenças abertas de cada sistema.
5. Política de reembolso frente ao CDC art. 49.

**Disclaimer de rodapé:**

> Quinto Dado é um projeto independente e não possui vínculo com as editoras dos sistemas citados. Materiais compatíveis são publicados sob as respectivas licenças abertas de cada sistema. Marcas e nomes mencionados pertencem a seus respectivos detentores.

---

## 22. Conteúdo e textos

Copy completa em `Textos_QuintoDado_v1.md`: herói, blocos da home, `/sobre`, ordem dos links, metadados de SEO por página e disclaimer.

Todos os textos derivam da bio real do MesaQuest e devem ser revisados pelo operador antes de publicar — é a voz dele, não a de quem escreveu o documento.

---

## 23. Roadmap detalhado

### Alfa — semana 1

- [ ] Setup: Next.js 15, TS, Tailwind, shadcn/ui, next-intl, cliente Supabase
- [ ] Design tokens (§19), layout base, header, footer, tema escuro
- [ ] Migração inicial do schema + seeds (sistemas, tags, `faixas_comissao`, links)
- [ ] Auth (Google, Discord, e-mail) + perfis + papéis
- [ ] Gating etário com RLS, **testado com usuário de 14 anos**
- [ ] Catálogo de suplementos gratuitos + filtros
- [ ] Download por URL assinada
- [ ] Uma tabela aleatória interativa (valida o formato)
- [ ] `/mesas` + detalhe + candidatura com ficha personalizada, **sem pagamento**
- [ ] Admin mínimo: mesa, suplemento, inscrições, links, depoimentos
- [ ] SEO base: metadata, OG, sitemap, JSON-LD
- [ ] Home, `/links`, `/sobre` com os textos aprovados
- [ ] Termos, Privacidade, Reembolso, Licença (rascunhos)

### v1 estável — semanas 2 e 3

- [ ] Integração de Pix + webhook idempotente
- [ ] Máquina de estados completa da inscrição
- [ ] Estorno automático (recusa, mínimo não atingido, cancelamento)
- [ ] Briefing pós-aprovação (e-mail + in-app)
- [ ] Consentimento de responsável para menores
- [ ] Suplementos pagos: compra, preview, marca d'água com nome/e-mail e metadados
- [ ] Kits temáticos
- [ ] `/apoie`
- [ ] Notificações in-app e por e-mail
- [ ] Métricas no admin
- [ ] Testes ponta a ponta do fluxo de pagamento

### Fase 2

Mestres convidados com split · avaliações mútuas · blog · lembretes automáticos · calendário com fuso · cartão e recorrência · candidatura pública a mestre · assinatura · inglês.

### 23.1 Sobre o prazo

Uma semana para o Alfa é apertado mas viável **porque o pagamento ficou de fora** — é exatamente esse o recorte.

Três semanas para a v1 com Pix, estorno automático e marca d'água é agressivo para uma pessoa só. **Se algo escorregar, corte primeiro os suplementos pagos** (o catálogo pago ainda não existe) e mantenha as mesas, que é onde está a receita hoje.

E **priorize o one-shot**: todas as mesas atuais são one-shots avulsos de R$35–40. Campanha, mensalidade e cobrança recorrente não são usados hoje e não merecem tempo de Alfa.

---

## 24. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Vazamento de WhatsApp/linhas e véus por `select *` | Alto — quebra de confiança | View pública sem os campos; RLS; revisar todo Server Component novo |
| Menor acessando conteúdo 18+ | Alto — legal e reputacional | Gating no servidor + RLS + fora do sitemap; testar sempre |
| Intermediação de pagamento como pessoa física | Alto — fiscal | Fase 2 só com split; nunca repasse manual |
| Prazo de 1 semana não cumprido | Médio | Alfa sem pagamento; cortar suplementos pagos antes de cortar mesas |
| Vercel Hobby em uso comercial | Médio — conta suspensa | Cloudflare ou VPS |
| Catálogo vazio no lançamento | Médio — site parece morto | Publicar 5–6 suplementos gratuitos antes de divulgar |
| Estorno frequente de suplemento pago | Baixo | Preview obrigatório |
| Gateway não permitir split agendado | Médio — só Fase 2 | Confirmar antes de implementar |

---

## 25. Definição de pronto

Uma entrega só está pronta quando:

- Funciona no mobile.
- RLS testado com usuário de outro papel e de outra faixa etária.
- Tem estado de carregamento e de erro.
- Tem estado vazio pensado (catálogo sem itens, mesa sem inscritos).
- Página pública tem `metadata` e Open Graph.
- Texto em pt-BR, sem jargão, vindo de arquivo de mensagem.
- Regra que mexe em dinheiro está coberta por teste automatizado.
- `build` e `test` passando.

---

## 26. Pendências

1. **Aprovar os textos** de `Textos_QuintoDado_v1.md`.
2. **Escolher e abrir a conta no gateway** (Asaas ou Mercado Pago) — homologação de Pix leva dias; faça na semana 1 mesmo sem usar.
3. **Registrar o domínio.**
4. **Escolher a hospedagem** à luz do §18.1.
5. **Perguntar ao gateway** se o split de Pix permite agendar a data de liberação (§12.3). Bloqueante apenas para a Fase 2.
6. **Advogado** para revisar os quatro documentos legais antes de publicar.
7. **Produzir 5–6 suplementos gratuitos** antes de divulgar o site.

---

## 27. Glossário

| Termo | Significado |
|---|---|
| **One-shot** | Aventura de sessão única, com começo, meio e fim |
| **Linhas e véus** | Ferramenta de segurança: temas vetados (linhas) ou tratados fora de cena (véus) |
| **VTT** | Virtual Tabletop — mesa virtual; aqui, Foundry VTT |
| **Homebrew** | Conteúdo caseiro, não oficial, criado para um sistema |
| **Split** | Divisão automática de um pagamento entre múltiplos recebedores, feita pelo gateway |
| **RLS** | Row Level Security — controle de acesso por linha, no próprio Postgres |
| **SRD / ORC** | Licenças abertas que permitem publicar material compatível com sistemas |
| **Gating etário** | Restrição de acesso a conteúdo conforme a idade do usuário |
| **Cauda longa** | Buscas específicas e de baixo volume que, somadas, trazem a maior parte do tráfego |

---

## 28. Adendo — Presencial BH (decidido em 07/09/2026)

Módulo novo, decidido em conversa direta com o operador depois da v1.0 deste
documento. Resumo executivo: uma aba dedicada a mesas **presenciais em Belo
Horizonte**, auto-publicadas por qualquer usuário com papel `mestre` — não só
pelo admin. É uma exceção pontual ao modelo "Fase 1 só admin cria mesa"
(§6, §11.2), justificada porque o Conflito A (§5.1) — o risco de
intermediação de pagamento por pessoa física — **não se aplica aqui**: o
site nunca processa dinheiro dessas mesas.

| # | Decisão | Motivo |
|---|---|---|
| D11 | Mestre cadastrado (papel `mestre` ou `admin`) pode criar mesa presencial diretamente, sem passar pelo admin criar por ele | Reduz fricção pra organizar jogo presencial em BH; a promoção pra papel `mestre` continua manual pelo admin (§9.3), então quem cria já foi aprovado uma vez |
| D12 | Valor da mesa presencial é **só informativo** — "sugestão pra cobrir handouts". Pagamento combinado e feito no local, fora do site | Sem intermediação de pagamento por pessoa física = sem o risco do Conflito A. Não depende do Asaas/Pix, então não fica bloqueado por integração de gateway |
| D13 | Toda mesa criada por mestre nasce em `aguardando_aprovacao`, igual a antes — a moderação do admin continua existindo (§11.2), só quem cria mudou | Mantém controle de qualidade/segurança sem reabrir moderação nenhuma |

**Impacto no modelo de dados** (aplicado em
`supabase/migrations/20260906234830_modelo_inicial.sql`, schema ainda não
lançado — editado direto em vez de empilhar migração):

- `mesas.preco_centavos` passa a aceitar `0` (gratuita) além de `>= 500`.
  Antes só aceitava mesa paga.
- Nova coluna `mesas.cobranca_gerenciada_pelo_site boolean default true`.
  `false` = mesa informal tipo Presencial BH: valor é só exibido, nunca entra
  no fluxo de Pix/webhook/`aguardando_pagamento`.
- Política de RLS `mesa_cria` (insert em `mesas`): admin cria qualquer mesa;
  usuário com papel `mestre` só cria com `mestre_id = auth.uid()`. Antes não
  existia nenhuma policy de insert em `mesas` — falha coberta agora.
- Políticas de leitura/gestão em `mesa_perguntas` (não existiam antes):
  leitura acompanha a visibilidade da mesa; escrita é só do dono/admin.
- Seed de `sistemas` (Ordem Paranormal/OP2, Tormenta 20, Vaesen, Fabula
  Ultima, Daggerheart, Sacramento RPG) em migração própria
  (`20260907172353_seeds_iniciais.sql`) — item que já estava no roadmap do
  Alfa (§23) e ficou pendente até esta tarefa precisar dele pro formulário
  de criação.

**Regra que vive na aplicação, não no banco** (mesmo padrão do §17.2): a
máquina de estados de inscrição (§11.4) só entra em `aguardando_pagamento`
quando `mesas.cobranca_gerenciada_pelo_site = true`. Pra mesa Presencial BH,
a candidatura vai direto de `candidatura_enviada` pra avaliação do mestre
(`aprovado`/`recusado`), sem etapa de pagamento — regra a implementar junto
com o fluxo de inscrição (ainda não construído).

**Páginas:** `/presencial-bh` (vitrine, filtrada por `modalidade = 'presencial'`
e `cidade_uf ilike '%belo horizonte%'`) e `/presencial-bh/nova` (formulário,
atrás de checagem de papel `mestre`/`admin`). Ambas construídas; a criação
em si (grava no banco) ainda não foi testada de ponta a ponta porque não
existe projeto Supabase real neste ambiente — só a validação de sintaxe da
migração (`libpg-query`) e o build/render das páginas foram verificados.
