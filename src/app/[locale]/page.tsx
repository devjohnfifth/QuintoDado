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
  if (!isSupabaseConfigured()) return { mesas: 0, suplementos: 0 };
  const supabase = await createClient();
  const [{ count: mesas }, { count: suplementos }] = await Promise.all([
    supabase.from("mesas").select("id", { count: "exact", head: true }).in("status", ["publicada", "confirmada", "em_andamento"]),
    supabase.from("suplementos").select("id", { count: "exact", head: true }).eq("publicado", true).eq("gratuito", true),
  ]);
  return { mesas: mesas ?? 0, suplementos: suplementos ?? 0 };
}

/** Cabeçalho de seção da home: título, subtítulo e "ver todos" (no celular o link desce pro fim da seção). */
function SecaoHome({
  titulo,
  subtitulo,
  verTodos,
  children,
}: {
  titulo: string;
  subtitulo: string;
  verTodos: { href: string; texto: string };
  children: React.ReactNode;
}) {
  const link = (classe: string) => (
    <Link href={verTodos.href} className={`items-center gap-1 text-sm font-medium text-primary hover:underline ${classe}`}>
      {verTodos.texto}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
  return (
    <Reveal className="border-t border-border/60 py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h2>
            <p className="mt-1 text-muted-foreground">{subtitulo}</p>
          </div>
          {link("hidden shrink-0 sm:inline-flex")}
        </div>
        <div className="mt-6">{children}</div>
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

      {/* Herói — baixo de propósito (pedido do João): a foto dá clima sem aumentar a altura. */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={grupoJogandoRpg}
          alt=""
          fill
          priority
          placeholder="blur"
          className="-z-20 object-cover opacity-25"
          sizes="100vw"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <Container className="py-10 text-center sm:py-14">
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Link href="/mesas" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground">
              <Dices className="size-3.5 text-primary" aria-hidden />
              {t("hero.statMesas", { n: contagem.mesas })}
            </Link>
            <Link href="/suplementos" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground">
              <BookOpen className="size-3.5 text-primary" aria-hidden />
              {t("hero.statSuplementos", { n: contagem.suplementos })}
            </Link>
          </p>

          <h1 className="mt-4 font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="text-marca">{t("hero.titulo")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">{t("hero.subtitulo")}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        </Container>
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
            <Carrossel itens={noticias.map((n) => ({ chave: n.chave, conteudo: renderNoticia(n, false) }))} />
          )}
        </SecaoHome>
      )}

      {suplementos.length > 0 && (
        <SecaoHome
          titulo={t("suplementosRecentes.titulo")}
          subtitulo={t("suplementosRecentes.subtitulo")}
          verTodos={{ href: "/suplementos", texto: t("suplementosRecentes.verTodos") }}
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
      <Reveal className="border-t border-border/60 py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t("faq.titulo")}</h2>
            <div className="divide-y divide-border/60 rounded-2xl border border-border bg-card/40">
              {perguntasFaq.map((item) => (
                <details key={item.pergunta} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                    {item.pergunta}
                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.resposta}</p>
                </details>
              ))}
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
      <Reveal className="border-t border-border/60 py-16">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/60 to-secondary/15 px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-marca text-white">
              <MessageCircle className="size-6" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t("comunidade.titulo")}</h2>
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
