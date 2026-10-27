import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/site/container";
import { Selo } from "@/components/site/selo";
import { FundoSemImagem } from "@/components/site/card-midia";
import { acessoAoPainel } from "@/lib/painel/acesso";
import { listarEntidades, listarSessoes } from "@/lib/painel/dados";
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

  // As contagens vão nas abas pra dar noção de volume antes de clicar. As
  // duas leituras são memoizadas por requisição, então as páginas filhas
  // reaproveitam em vez de ir ao banco de novo.
  const [entidades, sessoes] = await Promise.all([
    listarEntidades(acesso.mesa.id),
    listarSessoes(acesso.mesa.id),
  ]);

  return (
    <>
      {/* Faixa fina com a arte da mesa: o painel é um lugar dentro da mesa,
          e abrir com a capa dela diz isso sem precisar de texto. */}
      <section className="relative isolate flex min-h-48 items-end overflow-hidden border-b border-border/60">
        <div aria-hidden className="absolute inset-0 -z-20">
          {acesso.mesa.banner_url ? (
            <Image src={acesso.mesa.banner_url} alt="" fill priority className="object-cover" sizes="100vw" />
          ) : (
            <FundoSemImagem chave={slug} />
          )}
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/40"
        />

        <Container className="pb-6 pt-14">
          <p className="mb-3 text-sm">
            <Link
              href={`/mesas/${slug}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("voltarMesa")}
            </Link>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="rotulo-caps text-muted-foreground">{t("titulo")}</p>
              <h1 className="titulo-display titulo-secao mt-1.5">{acesso.mesa.titulo}</h1>
            </div>
            <Selo tom={acesso.ehMestre ? "marca" : "neutro"}>
              {acesso.ehMestre ? t("subtituloMestre") : t("subtituloJogador")}
            </Selo>
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        <AbasPainel slug={slug} entidades={entidades.length} sessoes={sessoes.length} />
        <div className="mt-8">{children}</div>
      </Container>
    </>
  );
}
