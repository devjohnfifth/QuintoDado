import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Reveal } from "@/components/site/reveal";
import emConstrucao from "@/assets/brand/em-construcao.svg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Material para a sua mesa — Quinto Dado";
  const description =
    "Tabelas de encontros, mapas, tokens, homebrews e aventuras prontas pro seu RPG. Catálogo em construção.";
  return {
    title,
    description,
    alternates: { canonical: "/suplementos" },
    openGraph: { title, description, locale, type: "website" },
  };
}

export default async function SuplementosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Suplementos");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-[10vw]">
      <Reveal>
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
          <BookOpen className="size-5" aria-hidden />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">{t("titulo")}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitulo")}</p>
      </Reveal>

      <Reveal className="mt-10">
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Image src={emConstrucao} alt="" className="mx-auto h-28 w-28" priority />
          <p className="mt-4 font-heading text-lg font-bold">{t("avisoTitulo")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {t("avisoCorpo")}
          </p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("cta")}
          </a>
        </div>
      </Reveal>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/mesas" className="text-primary hover:underline">
          Ver mesas abertas
        </Link>
      </p>
    </div>
  );
}
