import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { BookOpen, Dices, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import bannerOg from "@/assets/brand/banner-og.webp";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";
import { Reveal } from "@/components/site/reveal";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

async function buscarEstatisticasMestre() {
  if (!isSupabaseConfigured()) return { totalMesas: 0, porSistema: [] as { nome: string; total: number }[] };

  const supabase = await createClient();
  const { data: mestre } = await supabase.from("profiles").select("id").eq("papel", "admin").limit(1).maybeSingle();
  if (!mestre) return { totalMesas: 0, porSistema: [] };

  const { data: mesas } = await supabase
    .from("mesas")
    .select("sistema_outro, sistemas(nome)")
    .eq("mestre_id", mestre.id)
    .not("status", "in", "(rascunho,aguardando_aprovacao)");

  const contagem = new Map<string, number>();
  for (const m of mesas ?? []) {
    const linha = m as unknown as { sistema_outro: string | null; sistemas: { nome: string } | null };
    const nome = linha.sistema_outro || linha.sistemas?.nome;
    if (!nome) continue;
    contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
  }

  const porSistema = [...contagem.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  return { totalMesas: mesas?.length ?? 0, porSistema };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "O que é o Quinto Dado";
  const description =
    "Mesas de RPG, material autoral gratuito e uma comunidade que leva ferramentas de segurança a sério. Conheça as três frentes do Quinto Dado.";

  return {
    title,
    description,
    alternates: { canonical: "/sobre" },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: bannerOg.src, width: bannerOg.width, height: bannerOg.height }],
    },
  };
}

export default async function SobrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, { totalMesas, porSistema }] = await Promise.all([
    getTranslations("Sobre"),
    buscarEstatisticasMestre(),
  ]);

  const pilares = [
    { titulo: t("pilarSuplementosTitulo"), corpo: t("pilarSuplementosCorpo"), Icon: BookOpen },
    { titulo: t("pilarMesasTitulo"), corpo: t("pilarMesasCorpo"), Icon: Dices },
    { titulo: t("pilarComunidadeTitulo"), corpo: t("pilarComunidadeCorpo"), Icon: MessageCircle },
  ];

  const sistemas = t("sistemas").split(" · ");

  return (
    <article className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
      <Reveal>
        <div className="relative aspect-[3/1] w-[calc(100%+2rem)] -translate-x-4 overflow-hidden bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] sm:aspect-[4/1] sm:w-[calc(100%+3rem)] sm:-translate-x-6 sm:rounded-b-2xl">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1'/%3E%3C/svg%3E\")",
              backgroundSize: "60px 69px",
            }}
          />
        </div>

        <div className="relative -mt-12 inline-block sm:-mt-14">
          <Image
            src={mestreQuintao}
            alt="Mestre Quintão"
            className="size-24 rounded-full border-4 border-background object-cover object-top sm:size-28"
            priority
          />
        </div>

        <h1 className="mt-4 font-heading text-4xl font-bold">{t("titulo")}</h1>

        {(totalMesas > 0 || porSistema.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {totalMesas > 0 && (
              <p>
                <span className="font-heading text-lg font-bold text-primary">{totalMesas}</span>{" "}
                <span className="text-muted-foreground">
                  {totalMesas === 1 ? "mesa publicada" : "mesas publicadas"}
                </span>
              </p>
            )}
            {porSistema.length > 0 && (
              <p>
                <span className="font-heading text-lg font-bold text-primary">{porSistema.length}</span>{" "}
                <span className="text-muted-foreground">
                  {porSistema.length === 1 ? "sistema dominado" : "sistemas dominados"}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="group mt-6 border-l-2 border-primary/40 pl-6 transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-primary hover:bg-primary/[0.03]">
          <div className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5">
            {t("intro")
              .split("\n\n")
              .map((paragrafo, i) => (
                <p
                  key={i}
                  className="mt-4 text-muted-foreground transition-colors duration-300 first:mt-0 group-hover:text-foreground/90"
                >
                  {paragrafo}
                </p>
              ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-12">
        <h2 className="font-heading text-xl font-bold">{t("pilaresTitulo")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {pilares.map((pilar) => (
            <div
              key={pilar.titulo}
              className="group transform-gpu rounded-2xl border border-border bg-card/60 p-5 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-primary/40"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
                <pilar.Icon className="size-4" aria-hidden />
              </div>
              <h3 className="mt-3 font-heading text-sm font-bold">{pilar.titulo}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{pilar.corpo}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <div className="relative overflow-hidden rounded-2xl border border-border p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#4F7DF3]/10 via-transparent to-transparent"
          />
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
            <ShieldCheck className="size-4" aria-hidden />
          </div>
          <h2 className="mt-3 font-heading text-xl font-bold">{t("segurancaTitulo")}</h2>
          <p className="mt-2 text-muted-foreground">{t("segurancaCorpo")}</p>
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <h2 className="font-heading text-xl font-bold">{t("sistemasTitulo")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {porSistema.length > 0
            ? porSistema.map((s) => (
                <span
                  key={s.nome}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {s.nome}
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {s.total}
                  </span>
                </span>
              ))
            : sistemas.map((sistema) => (
                <span
                  key={sistema}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {sistema}
                </span>
              ))}
        </div>
      </Reveal>

      <Reveal className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/mesas"
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(139,92,246,0.55)]"
        >
          {t("ctaMesas")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href="/suplementos"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("ctaSuplementos")}
        </Link>
        <Link
          href="/links"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("ctaComunidade")}
        </Link>
      </Reveal>
    </article>
  );
}
