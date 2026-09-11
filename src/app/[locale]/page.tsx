import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Dices, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Reveal } from "@/components/site/reveal";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { EventoCarousel } from "@/components/site/evento-carousel";
import type { EventoCardData } from "@/components/site/evento-card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";

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

async function buscarEventosAbertos(): Promise<EventoCardData[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("slug, titulo, subtitulo, cidade_uf, data_inicio, banner_url, evento_ingresso_tipos(preco_centavos)")
    .eq("status", "publicado")
    .order("data_inicio", { ascending: true })
    .limit(6);

  if (error) {
    console.error("[home] erro ao buscar eventos:", error.message);
    return [];
  }

  return (data ?? []) as unknown as EventoCardData[];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, mesasAbertas, eventosAbertos] = await Promise.all([
    getTranslations("Home"),
    buscarMesasAbertas(),
    buscarEventosAbertos(),
  ]);
  const perguntasFaq = t.raw("faq.perguntas") as { pergunta: string; resposta: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Bloco 1 — herói */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: "80px 92px",
          }}
        />
        {/* Glows de marca — só uma sugestão de profundidade nos cantos, bem discretos pra não brigar com o texto */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-[90%] rounded-full bg-[#4F7DF3]/10 blur-[130px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[24rem] w-[24rem] translate-x-[40%] rounded-full bg-[#A855F7]/8 blur-[130px]"
        />

        <div className="mx-auto max-w-sm text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Dices className="size-3.5 text-primary" aria-hidden />
            {t("hero.eyebrow")}
          </span>

          <h1 className="mt-5 font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] bg-clip-text text-transparent">
              {t("hero.titulo")}
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {t("hero.subtitulo")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={SITE_LINKS.whatsappComunidade}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-6 py-3 text-center text-sm font-medium text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(139,92,246,0.55)] sm:w-auto"
            >
              {t("hero.ctaComunidade")}
            </a>
            <Link
              href="/mesas"
              className="w-full rounded-full border border-border px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
            >
              {t("hero.ctaMesas")}
            </Link>
          </div>
        </div>
      </section>

      {/* Bloco 3 — apresentação curta */}
      <Reveal className="px-4 py-16 sm:px-6">
        <div className="group mx-auto flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative mx-auto size-28 shrink-0 sm:mx-0">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[#4F7DF3]/30 to-[#A855F7]/30 blur-xl"
            />
            <Image
              src={mestreQuintao}
              alt="Mestre Quintão"
              className="size-28 rounded-full object-cover object-top"
              priority
            />
          </div>

          <div className="border-l-2 border-primary/40 pl-6 transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-primary group-hover:bg-primary/[0.03]">
            <div className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5">
              {t("apresentacao.corpo")
                .split("\n\n")
                .map((paragrafo, i) => (
                  <p
                    key={i}
                    className="mt-4 text-muted-foreground transition-colors duration-300 first:mt-0 group-hover:text-foreground/90"
                  >
                    {paragrafo}
                  </p>
                ))}
              <Link
                href="/sobre"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("apresentacao.ctaSobre")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Bloco 3' — eventos publicados, some se não houver nenhum */}
      {eventosAbertos.length > 0 && (
        <Reveal className="border-t border-border/60 px-4 py-16 sm:px-6 lg:px-[10vw]">
          <div className="mx-auto max-w-4xl lg:max-w-5xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold">{t("eventos.titulo")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("eventos.subtitulo")}</p>
              </div>
              <Link
                href="/eventos"
                className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                {t("eventos.verTodos")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-6">
              <EventoCarousel eventos={eventosAbertos} />
            </div>
            <Link
              href="/eventos"
              className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              {t("eventos.verTodos")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      )}

      {/* Bloco 4 — mesas abertas de verdade, some se não houver nenhuma */}
      {mesasAbertas.length > 0 && (
        <Reveal className="border-t border-border/60 px-4 py-16 sm:px-6 lg:px-[10vw]">
          <div className="mx-auto max-w-4xl lg:max-w-5xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold">{t("mesasAbertas.titulo")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("mesasAbertas.subtitulo")}</p>
              </div>
              <Link
                href="/mesas"
                className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
              >
                {t("mesasAbertas.verTodas")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mesasAbertas.map((mesa) => (
                <MesaCard key={mesa.slug} mesa={mesa} />
              ))}
            </div>
            <Link
              href="/mesas"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              {t("mesasAbertas.verTodas")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      )}

      {/* Blocos 4 e 5 — suplementos e mesas, lado a lado pra quebrar a pilha vertical */}
      <Reveal className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="group transform-gpu rounded-2xl border border-border bg-card/60 p-6 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
              <BookOpen className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold">
              {t("suplementos.titulo")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("suplementos.corpo")}
            </p>
            <Link
              href="/suplementos"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-primary"
            >
              {t("suplementos.cta")}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <div className="group transform-gpu rounded-2xl border border-border bg-card/60 p-6 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
              <Dices className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold">{t("mesas.titulo")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("mesas.corpo")}</p>
            <Link
              href="/mesas"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-primary"
            >
              {t("mesas.cta")}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Bloco 6 — prova social entra quando depoimentos existirem no banco */}

      {/* FAQ — também vira dado estruturado FAQPage logo abaixo */}
      <Reveal className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl font-bold">{t("faq.titulo")}</h2>
          <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border">
            {perguntasFaq.map((item) => (
              <details key={item.pergunta} className="group px-5 py-4 open:pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                  {item.pergunta}
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </Reveal>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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

      {/* Bloco 4' — comunidade */}
      <Reveal className="relative overflow-hidden border-t border-border/60 px-4 py-16 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#4F7DF3]/10 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
            <MessageCircle className="size-5" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">
            {t("comunidade.titulo")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("comunidade.corpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-6 py-3 text-sm font-medium text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(139,92,246,0.55)]"
          >
            {t("comunidade.cta")}
          </a>
        </div>
      </Reveal>
    </>
  );
}
