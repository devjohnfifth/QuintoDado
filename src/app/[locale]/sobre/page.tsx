import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { BookOpen, Dices, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import bannerOg from "@/assets/brand/banner-og.webp";
import grupoJogandoRpg from "@/assets/brand/grupo-jogando-rpg.jpg";
import { Reveal } from "@/components/site/reveal";

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
  const t = await getTranslations("Sobre");

  const pilares = [
    { titulo: t("pilarSuplementosTitulo"), corpo: t("pilarSuplementosCorpo"), Icon: BookOpen },
    { titulo: t("pilarMesasTitulo"), corpo: t("pilarMesasCorpo"), Icon: Dices },
    { titulo: t("pilarComunidadeTitulo"), corpo: t("pilarComunidadeCorpo"), Icon: MessageCircle },
  ];

  return (
    <article className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:px-[10vw]">
      <Reveal>
        <div className="relative aspect-[16/10] w-[calc(100%+2rem)] -translate-x-4 overflow-hidden sm:aspect-[3/1] sm:w-[calc(100%+3rem)] sm:-translate-x-6 sm:rounded-b-2xl lg:w-[calc(100%+20vw)] lg:-translate-x-[10vw]">
          <Image
            src={grupoJogandoRpg}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 672px) 720px, 100vw"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[#4F7DF3]/80 via-[#0B0B14]/50 to-[#A855F7]/70 mix-blend-multiply"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0B0B14] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <p className="font-heading text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl">
              Quinto Dado
            </p>
          </div>
        </div>

        <h1 className="mt-6 font-heading text-4xl font-bold">{t("titulo")}</h1>

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
