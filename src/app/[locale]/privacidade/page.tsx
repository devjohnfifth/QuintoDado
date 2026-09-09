import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidade — Quinto Dado",
  description:
    "Como o Quinto Dado coleta, usa e protege os dados de cadastro, candidatura a mesas e navegação no site.",
  alternates: { canonical: "/privacidade" },
};

export default async function PrivacidadePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");

  return (
    <LegalPage
      titulo={t("privacidadeTitulo")}
      corpo={t("privacidadeCorpo")}
      atualizadoEm={t("atualizadoEm")}
      voltar={t("voltar")}
    />
  );
}
