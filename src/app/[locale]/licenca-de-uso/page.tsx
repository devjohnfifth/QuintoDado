import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Licença de uso do material — Quinto Dado" };

export default async function LicencaDeUsoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");

  return (
    <LegalPage
      titulo={t("licencaTitulo")}
      corpo={t("licencaCorpo")}
      atualizadoEm={t("atualizadoEm")}
      voltar={t("voltar")}
    />
  );
}
