import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/site/container";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { CIDADES_PRESENCIAIS, SLUG_CIDADE, cidadeDoSlug } from "@/lib/mesas/cidades";
import { jsonLdSeguro } from "@/lib/json-ld";
import { buttonVariants } from "@/components/ui/button";
import {
  buscarMesasPresenciais,
  ListaDeMesasPresenciais,
  OutraCidade,
  ComoPublicar,
} from "../mesas-presenciais";
import { FOTO_CIDADE, fotoOuBanner } from "../fotos-cidade";

/**
 * Página de uma cidade atendida.
 *
 * Existe por causa da busca: quem procura mesa presencial procura "RPG
 * presencial em São Paulo", não "RPG presencial". Antes isso era
 * `/presencial?cidade=sao-paulo`, com canonical apontando pra página geral —
 * o que diz ao Google, literalmente, pra não indexar. Agora cada cidade tem
 * endereço, título, descrição e canonical próprios.
 *
 * A página existe mesmo sem mesa publicada na cidade: ela continua explicando
 * como funciona e levando pro moderador da região, que é o que faz a cidade
 * sair do zero. Página vazia de verdade seria só a lista; esta tem conteúdo.
 */

export function generateStaticParams() {
  return CIDADES_PRESENCIAIS.map((cidade) => ({ cidade: SLUG_CIDADE[cidade] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; cidade: string }>;
}): Promise<Metadata> {
  const { locale, cidade: slug } = await params;
  const cidade = cidadeDoSlug(slug);
  if (!cidade) return { title: "Cidade não encontrada — Quinto Dado", robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Presencial" });
  const title = t("metaTituloCidade", { cidade });
  const description = t("metaDescricaoCidade", { cidade });
  // Cada cidade usa a foto dela. Quem ainda não tem fica com o banner da
  // marca — ilustrar uma cidade com a foto de outra seria pior que não
  // ilustrar.
  const imagem = fotoOuBanner(cidade);

  return {
    title,
    description,
    alternates: { canonical: `/presencial/${slug}` },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: imagem.src, width: imagem.width, height: imagem.height }],
    },
  };
}

export default async function PresencialCidadePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; cidade: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { locale, cidade: slug } = await params;
  setRequestLocale(locale);

  const cidade = cidadeDoSlug(slug);
  if (!cidade) notFound();

  const t = await getTranslations("Presencial");
  const sp = await searchParams;
  const todasMesas = await buscarMesasPresenciais();
  const foto = FOTO_CIDADE[cidade];

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: site },
      { "@type": "ListItem", position: 2, name: t("titulo"), item: `${site}/presencial` },
      { "@type": "ListItem", position: 3, name: cidade, item: `${site}/presencial/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd) }} />

      <section className="relative overflow-hidden">
        {/* Só as cidades com foto própria ganham fundo. Nas outras o herói
            fica com a textura da marca — melhor um fundo neutro que a praça
            de outra cidade. */}
        {foto && (
          <div className="absolute inset-0 -z-10">
            <Image src={foto} alt="" fill priority className="object-cover opacity-70" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          </div>
        )}

        <Container className="py-12 sm:py-16">
          <p className="text-sm text-foreground/80">
            <Link href="/presencial" className="hover:text-foreground hover:underline">
              ← {t("voltarParaTodas")}
            </Link>
          </p>
          <h1 className="titulo-display titulo-pagina mt-2 max-w-3xl">{t("tituloCidade", { cidade })}</h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/80">{t("subtituloCidade", { cidade })}</p>
          <Link
            href="/mesas/nova?modalidade=presencial"
            className={buttonVariants({ variant: "outline", size: "lg", className: "mt-6 rounded-full" })}
          >
            {t("criarMesa")}
          </Link>
        </Container>
      </section>

      <ListaDeMesasPresenciais todasMesas={todasMesas} cidade={cidade} pagina={sp.pagina} />

      <OutraCidade />
      <ComoPublicar />

      <BlocoFechamento caminhos={["mesas", "eventos", "suplementos"]} />
    </>
  );
}
