import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { BookOpen, Dices, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import bannerOg from "@/assets/brand/banner-og.webp";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";
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

  const sistemas = t("sistemas").split(" · ");

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="relative inline-block">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#4F7DF3]/20 blur-2xl"
          />
          <Image
            src={mestreQuintao}
            alt="Mestre Quintão"
            className="size-20 rounded-full object-cover object-top ring-1 ring-border"
            priority
          />
        </div>

        <h1 className="mt-6 font-heading text-4xl font-bold">{t("titulo")}</h1>

        <div className="group border-l-2 border-primary/40 pl-6 transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-primary hover:bg-primary/[0.03]">
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
          {sistemas.map((sistema) => (
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
