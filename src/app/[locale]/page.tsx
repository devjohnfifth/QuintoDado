import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Dices, MessageCircle, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/site/container";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { SuplementoCard } from "@/components/site/suplemento-card";
import { Carrossel } from "@/components/site/carrossel";
import { NumeroAnimado } from "@/components/site/numero-animado";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import { EventoCard, type EventoCardData } from "@/components/site/evento-card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { listarSuplementos } from "@/lib/suplementos/publico";
import { jsonLdSeguro } from "@/lib/json-ld";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";
import grupoJogandoRpg from "@/assets/brand/grupo-jogando-rpg.jpg";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site}/#pessoa`,
      name: "Mestre Quintão",
      alternateName: "Quinto Dado",
      description:
        "Criador e mestre de RPG brasileiro. Mesas de Ordem Paranormal, Tormenta 20, Vaesen, Fabula Ultima e Daggerheart, além de material autoral gratuito.",
      url: site,
      image: `${site}${mestreQuintao.src}`,
      sameAs: [SITE_LINKS.instagram, SITE_LINKS.mesaquest].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${site}/#site`,
      name: "Quinto Dado",
      url: site,
      inLanguage: "pt-BR",
      publisher: { "@id": `${site}/#pessoa` },
    },
  ],
};

async function buscarMesasAbertas(): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo)",
    )
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .order("data_inicio", { ascending: true })
    .limit(3);

  if (error) {
    console.error("[home] erro ao buscar mesas abertas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaCardData[];
}

type EventoNoticia = EventoCardData & { criado_em: string };

/** Suplemento publicado há até tantos dias entra no carrossel de notícias como novidade. */
const DIAS_SUPLEMENTO_NOVO = 30;

async function buscarEventosAbertos(): Promise<EventoNoticia[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("slug, titulo, subtitulo, cidade_uf, data_inicio, banner_url, criado_em, evento_ingresso_tipos(preco_centavos)")
    .eq("status", "publicado")
    .order("data_inicio", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[home] erro ao buscar eventos:", error.message);
    return [];
  }

  return (data ?? []) as unknown as EventoNoticia[];
}

async function contarConteudo() {
  if (!isSupabaseConfigured()) return { mesas: 0, suplementos: 0, tabelas: 0 };
  const supabase = await createClient();
  const [{ count: mesas }, { count: suplementos }, { count: tabelas }] = await Promise.all([
    supabase.from("mesas").select("id", { count: "exact", head: true }).in("status", ["publicada", "confirmada", "em_andamento"]),
    supabase.from("suplementos").select("id", { count: "exact", head: true }).eq("publicado", true).eq("gratuito", true),
    // `!inner` pra só contar tabela que está mesmo no ar: a contagem aparece
    // no herói e não pode incluir rascunho.
    supabase
      .from("tabelas_aleatorias")
      .select("id, suplementos!inner(publicado, gratuito)", { count: "exact", head: true })
      .eq("suplementos.publicado", true)
      .eq("suplementos.gratuito", true),
  ]);
  return { mesas: mesas ?? 0, suplementos: suplementos ?? 0, tabelas: tabelas ?? 0 };
}

/** Cabeçalho de seção da home: título, subtítulo e "ver todos" (no celular o link desce pro fim da seção). */
function SecaoHome({
  titulo,
  subtitulo,
  verTodos,
  fundo = false,
  children,
}: {
  titulo: string;
  subtitulo: string;
  verTodos: { href: string; texto: string };
  /** true = seção sobre painel, pra alternar com as de fundo preto. */
  fundo?: boolean;
  children: React.ReactNode;
}) {
  const link = (classe: string) => (
    <Link href={verTodos.href} className={`items-center gap-1 text-sm font-medium text-primary hover:underline ${classe}`}>
      {verTodos.texto}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
  return (
    // `fundo` alterna entre o preto do site e um painel um degrau acima:
    // é o que dá ritmo à rolagem, em vez de tudo chapado igual.
    <Reveal className={`relative border-t border-border/60 py-20 ${fundo ? "textura-grao bg-superficie" : ""}`}>
      <Container className="relative">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="titulo-display titulo-secao">{titulo}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{subtitulo}</p>
          </div>
          {link("hidden shrink-0 sm:inline-flex")}
        </div>
        <div className="mt-8">{children}</div>
        {link("mt-6 flex justify-center sm:hidden")}
      </Container>
    </Reveal>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, mesasAbertas, eventosAbertos, todosSuplementos, contagem] = await Promise.all([
    getTranslations("Home"),
    buscarMesasAbertas(),
    buscarEventosAbertos(),
    listarSuplementos(),
    contarConteudo(),
  ]);
  // Na home só o que está no ar — o admin não vê rascunho misturado aqui.
  const publicados = todosSuplementos.filter((s) => s.publicado);

  // Notícias: eventos abertos + até 3 suplementos publicados recentemente, do
  // mais novo pro mais antigo (evento conta pela data em que foi criado). Os
  // suplementos que entram aqui saem de "Últimos suplementos", logo abaixo,
  // pra mesma capa não aparecer duas vezes seguidas.
  const limiteNovidade = Date.now() - DIAS_SUPLEMENTO_NOVO * 86_400_000;
  const suplementosNovos = publicados
    .filter((s) => s.publicado_em && new Date(s.publicado_em).getTime() >= limiteNovidade)
    .slice(0, 3);
  const suplementos = publicados.filter((s) => !suplementosNovos.includes(s)).slice(0, 6);
  const noticias = [
    ...eventosAbertos.map((e) => ({ tipo: "evento" as const, chave: `evento-${e.slug}`, data: e.criado_em, evento: e })),
    ...suplementosNovos.map((s) => ({
      tipo: "suplemento" as const,
      chave: `suplemento-${s.slug}`,
      data: s.publicado_em!,
      suplemento: s,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const renderNoticia = (n: (typeof noticias)[number], destaque: boolean) =>
    n.tipo === "evento" ? (
      <EventoCard evento={n.evento} destaque={destaque} />
    ) : (
      <SuplementoCard suplemento={n.suplemento} destaque={destaque} noticia />
    );
  const perguntasFaq = t.raw("faq.perguntas") as { pergunta: string; resposta: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }} />

      {/* Herói: ocupa 78vh pra abrir a página com presença, e o primeiro card
          da seção seguinte fica espiando na borda — é o que convida a rolar. */}
      <section className="textura-grao relative isolate flex min-h-[78vh] items-center overflow-hidden">
        {/* A foto aparece de verdade (era 25% sobre preto, sumia) e sobe
            devagar com a rolagem. O degradê só protege a leitura do texto. */}
        <Image
          src={grupoJogandoRpg}
          alt=""
          fill
          priority
          placeholder="blur"
          className="parallax-heroi -z-20 object-cover opacity-60"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(75%_60%_at_50%_35%,transparent,var(--qd-fundo)_78%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-background to-transparent"
        />

        <Container className="py-16 text-center sm:py-20">
          <p className="rotulo-caps text-foreground/70">{t("hero.eyebrow")}</p>

          <h1 className="titulo-display titulo-hero mt-4">
            <span className="text-marca drop-shadow-[0_4px_24px_rgba(79,125,243,0.35)]">{t("hero.titulo")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/80 sm:text-xl">{t("hero.subtitulo")}</p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={SITE_LINKS.whatsappComunidade}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "marca", size: "lg", className: "w-full sm:w-auto" })}
            >
              <MessageCircle className="size-4" aria-hidden />
              {t("hero.ctaComunidade")}
            </a>
            <Link
              href="/mesas"
              className={buttonVariants({ variant: "outline", size: "lg", className: "w-full rounded-full bg-background/60 sm:w-auto" })}
            >
              {t("hero.ctaMesas")}
            </Link>
          </div>

          {/* Os três números num bloco só: antes eram dois selos que empilhavam
              tortos no celular e não diziam o tamanho do acervo. */}
          <ul className="mx-auto mt-10 grid max-w-lg grid-cols-3 divide-x divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-background/50 backdrop-blur-md">
            {[
              { href: "/mesas", Icone: Dices, n: contagem.mesas, rotulo: t("hero.statMesas", { n: contagem.mesas }) },
              {
                href: "/suplementos",
                Icone: BookOpen,
                n: contagem.suplementos,
                rotulo: t("hero.statSuplementos", { n: contagem.suplementos }),
              },
              {
                href: "/suplementos",
                Icone: Dices,
                n: contagem.tabelas,
                rotulo: t("hero.statTabelas", { n: contagem.tabelas }),
              },
            ].map((stat, i) => (
              <li key={i}>
                <Link
                  href={stat.href}
                  className="group flex h-full flex-col items-center gap-0.5 px-2 py-4 transition-colors hover:bg-foreground/5"
                >
                  <stat.Icone className="size-4 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden />
                  <span className="titulo-display mt-1 text-3xl text-primary sm:text-4xl">
                    <NumeroAnimado valor={stat.n} />
                  </span>
                  {/* O rótulo já traz o número por causa do plural; aqui só
                      interessa a palavra, então o número sai do texto. */}
                  <span className="text-xs leading-tight text-muted-foreground">
                    {stat.rotulo.replace(/^\d+\s*/, "")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>

        <p className="rotulo-caps absolute inset-x-0 bottom-5 flex flex-col items-center gap-1 text-foreground/45">
          {t("hero.rolar")}
          <ChevronDown className="size-4 motion-safe:animate-bounce" aria-hidden />
        </p>
      </section>

      {noticias.length > 0 && (
        <SecaoHome
          titulo={t("eventos.titulo")}
          subtitulo={t("eventos.subtitulo")}
          verTodos={{ href: "/eventos", texto: t("eventos.verTodos") }}
        >
          {noticias.length <= 3 ? (
            <GradeAdaptavel itens={noticias} chave={(n) => n.chave} render={renderNoticia} />
          ) : (
            <>
              {/* O item mais novo abre a seção em destaque, largo; o resto
                  segue na trilha. Antes todos tinham o mesmo peso e nada
                  dizia o que era novidade de verdade. */}
              <div className="mb-4">{renderNoticia(noticias[0], true)}</div>
              <Carrossel
                itens={noticias.slice(1).map((n) => ({ chave: n.chave, conteudo: renderNoticia(n, false) }))}
              />
            </>
          )}
        </SecaoHome>
      )}

      {suplementos.length > 0 && (
        <SecaoHome
          titulo={t("suplementosRecentes.titulo")}
          subtitulo={t("suplementosRecentes.subtitulo")}
          verTodos={{ href: "/suplementos", texto: t("suplementosRecentes.verTodos") }}
          fundo
        >
          <GradeAdaptavel
            itens={suplementos}
            chave={(s) => s.slug}
            render={(s, destaque) => <SuplementoCard suplemento={s} destaque={destaque} />}
          />
        </SecaoHome>
      )}

      {mesasAbertas.length > 0 && (
        <SecaoHome
          titulo={t("mesasAbertas.titulo")}
          subtitulo={t("mesasAbertas.subtitulo")}
          verTodos={{ href: "/mesas", texto: t("mesasAbertas.verTodas") }}
        >
          <GradeAdaptavel
            itens={mesasAbertas}
            chave={(m) => m.slug}
            render={(mesa, destaque) => <MesaCard mesa={mesa} destaque={destaque} />}
          />
        </SecaoHome>
      )}

      {/* FAQ — também vira dado estruturado FAQPage logo abaixo */}
      <Reveal className="relative border-t border-border/60 py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <h2 className="titulo-display titulo-secao">{t("faq.titulo")}</h2>
            <div className="relative overflow-hidden rounded-2xl painel">
              <D20MarcaDagua className="pointer-events-none absolute -right-14 -top-14 size-64 text-foreground/[0.035]" />
              <div className="relative divide-y divide-border/60">
                {perguntasFaq.map((item, i) => (
                  <details key={item.pergunta} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center gap-3 font-medium marker:content-none">
                      {/* O número vira face de dado — o mesmo tratamento das
                          faixas da tabela aleatória. */}
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/50 bg-primary/10 font-heading text-xs font-bold tabular-nums text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1">{item.pergunta}</span>
                      <ChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <p className="mt-2 pl-10 text-sm text-muted-foreground motion-safe:animate-[reveal-up_0.25s_ease-out]">
                      {item.resposta}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Reveal>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: perguntasFaq.map((item) => ({
              "@type": "Question",
              name: item.pergunta,
              acceptedAnswer: { "@type": "Answer", text: item.resposta },
            })),
          }),
        }}
      />

      {/* Comunidade */}
      <Reveal className="relative border-t border-border/60 py-20">
        <Container>
          <div className="brilho-marca textura-grao relative overflow-hidden rounded-3xl border border-primary/30 px-6 py-14 text-center shadow-[0_0_60px_-20px_color-mix(in_oklch,var(--qd-secundaria)_70%,transparent)] sm:px-10">
            <D20MarcaDagua className="pointer-events-none absolute -left-16 -top-16 size-80 text-foreground/[0.04]" />
            <D20MarcaDagua className="pointer-events-none absolute -bottom-20 -right-16 size-72 text-foreground/[0.03]" />
            <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-marca text-white shadow-[0_10px_30px_-10px_color-mix(in_oklch,var(--qd-secundaria)_80%,transparent)]">
              <MessageCircle className="size-7" aria-hidden />
            </div>
            <h2 className="titulo-display titulo-secao mt-5">{t("comunidade.titulo")}</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{t("comunidade.corpo")}</p>
            <a
              href={SITE_LINKS.whatsappComunidade}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "marca", size: "lg", className: "mt-6" })}
            >
              {t("comunidade.cta")}
            </a>
          </div>
        </Container>
      </Reveal>
    </>
  );
}
