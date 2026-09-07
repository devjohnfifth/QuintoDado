import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import bannerOg from "@/assets/brand/banner-og.webp";
import logo5d from "@/assets/brand/logo-5d.png";

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
    { titulo: t("pilarSuplementosTitulo"), corpo: t("pilarSuplementosCorpo") },
    { titulo: t("pilarMesasTitulo"), corpo: t("pilarMesasCorpo") },
    { titulo: t("pilarComunidadeTitulo"), corpo: t("pilarComunidadeCorpo") },
  ];

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Image src={logo5d} alt="" className="h-16 w-16 rounded-xl" priority />

      <h1 className="mt-6 font-heading text-4xl font-bold">{t("titulo")}</h1>

      {t("intro")
        .split("\n\n")
        .map((paragrafo, i) => (
          <p key={i} className="mt-4 text-muted-foreground">
            {paragrafo}
          </p>
        ))}

      <h2 className="mt-10 font-heading text-xl font-bold">{t("pilaresTitulo")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {pilares.map((pilar) => (
          <div key={pilar.titulo} className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-heading text-sm font-bold">{pilar.titulo}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{pilar.corpo}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-heading text-xl font-bold">{t("segurancaTitulo")}</h2>
      <p className="mt-2 text-muted-foreground">{t("segurancaCorpo")}</p>

      <h2 className="mt-10 font-heading text-xl font-bold">{t("sistemasTitulo")}</h2>
      <p className="mt-2 text-muted-foreground">{t("sistemas")}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/mesas"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("ctaMesas")}
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
      </div>
    </article>
  );
}
