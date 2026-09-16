import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bot, Download, FileText, LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DescricaoMarkdown } from "@/components/site/descricao-markdown";
import { TabelasAleatorias } from "@/components/site/tabela-aleatoria";
import { buscarSuplemento } from "@/lib/suplementos/publico";
import {
  FORMATO_LABEL,
  TIPO_SUPLEMENTO,
  formatarTamanho,
  type FormatoArquivo,
  type TipoSuplemento,
} from "@/lib/suplementos/labels";
import { CLASSIFICACAO_LABEL } from "@/lib/mesas/labels";
import { jsonLdSeguro } from "@/lib/json-ld";
import bannerOg from "@/assets/brand/banner-og.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Suplementos" });
  const resultado = await buscarSuplemento(slug);
  if (!resultado) return { title: t("naoEncontrado"), robots: { index: false } };

  const { suplemento: s } = resultado;
  const title = `${s.titulo} — Quinto Dado`;
  const description = s.resumo;
  const imagem = s.capa_url
    ? [{ url: s.capa_url }]
    : [{ url: bannerOg.src, width: bannerOg.width, height: bannerOg.height }];

  return {
    title,
    description,
    alternates: { canonical: `/suplementos/${slug}` },
    openGraph: { title, description, locale, type: "article", images: imagem },
    twitter: { card: "summary_large_image", title, description, images: imagem.map((i) => i.url) },
    // Rascunho só aparece pro admin; nunca pode entrar em índice.
    ...(s.publicado ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function SuplementoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Suplementos");

  // O RLS devolve null pra rascunho (exceto admin) e pra classificação acima
  // da idade de quem pede — inclusive por URL direta.
  const resultado = await buscarSuplemento(slug);
  if (!resultado) notFound();
  const { suplemento: s, arquivos, tabelas, logado } = resultado;

  const tipo = TIPO_SUPLEMENTO[s.tipo as TipoSuplemento]?.rotulo ?? s.tipo;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbInicio"), item: site },
      { "@type": "ListItem", position: 2, name: t("titulo"), item: `${site}/suplementos` },
      { "@type": "ListItem", position: 3, name: s.titulo, item: `${site}/suplementos/${slug}` },
    ],
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
      {s.publicado && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd) }} />
      )}

      {!s.publicado && (
        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          {t("rascunhoAviso")}
        </p>
      )}

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          {t("breadcrumbInicio")}
        </Link>
        <span aria-hidden>/</span>
        <Link href="/suplementos" className="hover:text-foreground hover:underline">
          {t("titulo")}
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-foreground/80">{s.titulo}</span>
      </nav>

      {s.capa_url && (
        <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={s.capa_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 800px, 100vw"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">{tipo}</span>
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {s.sistemas?.nome ?? t("generico")}
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          {t("gratuito")}
        </span>
        {s.classificacao !== "livre" && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {CLASSIFICACAO_LABEL[s.classificacao] ?? s.classificacao}
          </span>
        )}
      </div>

      <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">{s.titulo}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{s.resumo}</p>

      {s.descricao_md && (
        <div className="mt-6">
          <DescricaoMarkdown texto={s.descricao_md} />
        </div>
      )}

      {s.usa_ia && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground">
          <Bot className="size-4 shrink-0 text-primary" aria-hidden />
          {t("usaIa")}
        </p>
      )}

      {tabelas.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold">{t("tabelasTitulo")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("tabelasSubtitulo")}</p>
          <div className="mt-5">
            <TabelasAleatorias tabelas={tabelas} />
          </div>
        </section>
      )}

      {arquivos.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold">{t("arquivosTitulo")}</h2>
          <ul className="mt-4 divide-y divide-border/60 rounded-2xl border border-border bg-card/60">
            {arquivos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{a.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {FORMATO_LABEL[a.formato as FormatoArquivo] ?? a.formato}
                  {a.tamanho_bytes ? ` · ${formatarTamanho(a.tamanho_bytes)}` : ""}
                </span>
                {logado ? (
                  <a
                    href={`/api/suplementos/baixar/${a.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <Download className="size-3.5" aria-hidden />
                    {t("baixar")}
                  </a>
                ) : (
                  <Link
                    href={{ pathname: "/entrar", query: { next: `/suplementos/${slug}` } }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-primary"
                  >
                    <LogIn className="size-3.5" aria-hidden />
                    {t("entrarPraBaixar")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 space-y-1 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        <p>
          {t("licenca")}{" "}
          <Link href="/licenca-de-uso" className="text-primary hover:underline">
            {t("licencaLink")}
          </Link>
        </p>
        {s.licenca_base && <p>{t("licencaBase", { licenca: s.licenca_base })}</p>}
        {s.atribuicao && <p>{t("atribuicao", { atribuicao: s.atribuicao })}</p>}
        <p className="pt-4">
          <Link href="/suplementos" className="text-primary hover:underline">
            ← {t("voltar")}
          </Link>
        </p>
      </footer>
    </article>
  );
}
