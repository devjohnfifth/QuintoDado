import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Sobre o Quinto Dado — João Quintão, mestre de RPG",
    description:
      "Mestre de RPG bilíngue, worldbuilder e criador de material autoral. Conheça o trabalho por trás das mesas do Quinto Dado.",
    openGraph: { locale, type: "profile" },
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

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold">{t("titulo")}</h1>

      {t("intro")
        .split("\n\n")
        .map((paragrafo, i) => (
          <p key={i} className="mt-4 text-muted-foreground">
            {paragrafo}
          </p>
        ))}

      <h2 className="mt-10 font-heading text-xl font-bold">
        {t("comoEuMestroTitulo")}
      </h2>
      <p className="mt-2 text-muted-foreground">{t("comoEuMestroCorpo")}</p>

      <h2 className="mt-10 font-heading text-xl font-bold">
        {t("sistemasTitulo")}
      </h2>
      <p className="mt-2 text-muted-foreground">{t("sistemas")}</p>

      <h2 className="mt-10 font-heading text-xl font-bold">
        {t("produzoTitulo")}
      </h2>
      <p className="mt-2 text-muted-foreground">{t("produzoCorpo")}</p>

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
