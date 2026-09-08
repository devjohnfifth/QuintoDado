import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Termos de uso — Quinto Dado" };

export default async function TermosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");

  return (
    <LegalPage
      titulo={t("termosTitulo")}
      corpo={t("termosCorpo")}
      atualizadoEm={t("atualizadoEm")}
      voltar={t("voltar")}
    />
  );
}
