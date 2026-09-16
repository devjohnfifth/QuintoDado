import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { BookOpen, Dices, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import bannerOg from "@/assets/brand/banner-og.webp";
import grupoJogandoRpg from "@/assets/brand/grupo-jogando-rpg.jpg";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/site/container";
import { buttonVariants } from "@/components/ui/button";
import { SITE_LINKS } from "@/lib/site-links";

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
    <article className="pb-16">
      <Container className="pt-6 sm:pt-10">
        {/* Capa com o título dentro — um H1 só, sem repetir "Quinto Dado" logo abaixo. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border sm:aspect-[3/1]">
          <Image
            src={grupoJogandoRpg}
            alt=""
            fill
            priority
            placeholder="blur"
            className="object-cover"
            sizes="(min-width: 1024px) 768px, 100vw"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/70 via-background/50 to-secondary/60 mix-blend-multiply" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Quinto Dado</p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl">
              {t("titulo")}
            </h1>
          </div>
        </div>

        <div className="mt-8 max-w-3xl space-y-4 border-l-2 border-primary/40 pl-6 text-lg text-muted-foreground">
          {t("intro")
            .split("\n\n")
            .map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
        </div>

        <Reveal className="mt-14">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{t("pilaresTitulo")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {pilares.map((pilar) => (
              <div
                key={pilar.titulo}
                className="rounded-2xl border border-border bg-card/60 p-5 transition-colors duration-300 hover:border-primary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <pilar.Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-heading text-lg font-bold">{pilar.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{pilar.corpo}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-8">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-transparent p-6 sm:p-8">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight">{t("segurancaTitulo")}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{t("segurancaCorpo")}</p>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative mx-auto size-32 shrink-0 sm:mx-0">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl"
              />
              <Image src={mestreQuintao} alt="Mestre Quintão" className="size-32 rounded-full object-cover object-top" />
            </div>

            <div className="max-w-3xl">
              <h2 className="font-heading text-2xl font-bold tracking-tight">{t("mestreTitulo")}</h2>
              {t("mestreCorpo")
                .split("\n\n")
                .map((paragrafo, i) => (
                  <p key={i} className="mt-3 text-muted-foreground">
                    {paragrafo}
                  </p>
                ))}
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t("sistemasTitulo")}:</span> {t("sistemas")}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/mesas" className={buttonVariants({ variant: "marca", size: "lg" })}>
            {t("ctaMesas")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/suplementos" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}>
            {t("ctaSuplementos")}
          </Link>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}
          >
            {t("ctaComunidade")}
          </a>
        </Reveal>
      </Container>
    </article>
  );
}
