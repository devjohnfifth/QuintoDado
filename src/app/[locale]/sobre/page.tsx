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
import { LOGO_SISTEMA } from "@/lib/mesas/logos-sistemas";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";

/** Os sistemas que o Quintão mestra, na ordem em que aparecem no texto. */
const SISTEMAS_MESTRADOS = [
  "ordem-paranormal-2",
  "tormenta-20",
  "vaesen",
  "fabula-ultima",
  "daggerheart",
  "sacramento-rpg",
] as const;

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
        {/* Cartão de capa com o título dentro — um H1 só, sem repetir
            "Quinto Dado" logo abaixo. O João prefere este enquadramento ao
            herói sangrado, então ele fica. */}
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
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-primary/70 via-background/50 to-secondary/60 mix-blend-multiply"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <p className="rotulo-caps text-white/80">Quinto Dado</p>
            <h1 className="titulo-display titulo-secao mt-1 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {t("titulo")}
            </h1>
          </div>
        </div>

        <div className="mt-10 max-w-[65ch] space-y-5 border-l-2 border-primary/50 pl-6 text-lg leading-relaxed text-foreground/85">
          {t("intro")
            .split("\n\n")
            .map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
        </div>

        <Reveal className="mt-14">
          <h2 className="titulo-display titulo-secao">{t("pilaresTitulo")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {pilares.map((pilar) => (
              <div
                key={pilar.titulo}
                className="elevar hover:elevar-hover rounded-2xl painel p-6"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <pilar.Icon className="size-6" aria-hidden />
                </div>
                <h3 className="titulo-display titulo-bloco mt-4">{pilar.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{pilar.corpo}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-10">
          {/* Segurança é o diferencial real da casa e dividia o mesmo peso
              visual de todo o resto. Painel alto, escudo grande e o verde do
              "a mesa toda vê" pra marcar que aqui é combinado. */}
          <div className="relative overflow-hidden rounded-3xl painel-alto p-6 ring-1 ring-sucesso/25 sm:p-9">
            <D20MarcaDagua className="pointer-events-none absolute -right-12 -top-12 size-64 text-sucesso/[0.06]" />
            <div className="relative">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-sucesso/15 text-sucesso">
                <ShieldCheck className="size-7" aria-hidden />
              </div>
              <h2 className="titulo-display titulo-secao mt-5">{t("segurancaTitulo")}</h2>
              <p className="mt-3 max-w-[65ch] text-lg leading-relaxed text-foreground/85">{t("segurancaCorpo")}</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 blur-2xl"
              />
              <div className="rounded-full bg-marca p-[3px]">
                <Image
                  src={mestreQuintao}
                  alt="Mestre Quintão"
                  className="size-40 rounded-full object-cover object-top ring-4 ring-background sm:size-48"
                />
              </div>
            </div>

            <div className="max-w-[65ch]">
              <h2 className="titulo-display titulo-secao">{t("mestreTitulo")}</h2>
              {t("mestreCorpo")
                .split("\n\n")
                .map((paragrafo, i) => (
                  <p key={i} className="mt-3 leading-relaxed text-foreground/85">
                    {paragrafo}
                  </p>
                ))}
              <div className="mt-6">
                <p className="rotulo-caps text-muted-foreground">{t("sistemasTitulo")}</p>
                {/* As logos já existem no projeto (LOGO_SISTEMA, as mesmas do
                    card de mesa). A linha de nomes separados por ponto dizia
                    o mesmo sem peso nenhum — fica como texto pra leitor de
                    tela e pra busca. */}
                <p className="sr-only">{t("sistemas")}</p>
                <ul aria-hidden className="mt-3 flex flex-wrap items-center gap-2">
                  {SISTEMAS_MESTRADOS.map((slug) => {
                    const logo = LOGO_SISTEMA[slug];
                    if (!logo) return null;
                    return (
                      <li key={slug} className="relative h-9 w-24 overflow-hidden rounded-md bg-white">
                        <Image src={logo} alt="" fill className="object-cover" sizes="96px" />
                      </li>
                    );
                  })}
                </ul>
              </div>
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
