import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/site/container";
import { PageHeader } from "@/components/site/page-header";
import { acessoAoPainel } from "@/lib/painel/acesso";
import { AbasPainel } from "./abas-painel";

// Conteúdo de campanha nunca entra em índice de busca.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PainelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Painel");

  // Quem não é membro leva 404: "sem permissão" já confirmaria que existe
  // conteúdo ali dentro.
  const acesso = await acessoAoPainel(slug);
  if (!acesso) notFound();

  return (
    <Container className="py-10 sm:py-16">
      <p className="mb-4 text-sm">
        <Link
          href={`/mesas/${slug}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("voltarMesa")}
        </Link>
      </p>

      <PageHeader
        icone={BookOpen}
        titulo={acesso.mesa.titulo}
        subtitulo={acesso.ehMestre ? t("subtituloMestre") : t("subtituloJogador")}
      />

      <div className="mt-6">
        <AbasPainel slug={slug} />
      </div>

      <div className="mt-8">{children}</div>
    </Container>
  );
}
