import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { permanentRedirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import pracaSete from "@/assets/presencial/praca-sete.webp";
import { Container } from "@/components/site/container";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { SLUG_CIDADE, cidadeDoSlug, listaDeCidades } from "@/lib/mesas/cidades";
import { buttonVariants } from "@/components/ui/button";
import {
  buscarMesasPresenciais,
  ListaDeMesasPresenciais,
  OutraCidade,
  ComoPublicar,
} from "./mesas-presenciais";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  /*
   * O título não lista mais as cidades: com cinco já passava de 70 caracteres
   * (o Google corta perto de 60) e a lista vai crescer. Quem procura por
   * cidade cai na página dela, que carrega o nome no próprio título. Aqui
   * fica a palavra-chave geral, e as cidades entram na descrição, montadas a
   * partir da lista de verdade.
   */
  const title = "RPG de mesa presencial: ache mesa na sua cidade — Quinto Dado";
  const description = `Mesas presenciais de RPG em ${listaDeCidades()}, criadas por mestres cadastrados no Quinto Dado. Grátis ou com valor combinado direto com quem mestra.`;

  return {
    title,
    description,
    alternates: { canonical: "/presencial" },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: pracaSete.src, width: pracaSete.width, height: pracaSete.height }],
    },
  };
}

type Filtros = { cidade?: string; pagina?: string };

export default async function PresencialPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Filtros>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Presencial");
  const sp = await searchParams;

  /*
   * O filtro por cidade morava em `?cidade=sao-paulo`, com canonical apontando
   * de volta pra cá — ou seja, pedindo pro Google ignorar. Agora cada cidade
   * tem endereço próprio, e o endereço antigo (que já circulou e está
   * indexado) manda pra lá em vez de mostrar o mesmo conteúdo em duas URLs.
   */
  const cidadeDaQuery = cidadeDoSlug(sp.cidade);
  if (cidadeDaQuery) {
    permanentRedirect(`/presencial/${SLUG_CIDADE[cidadeDaQuery]}`);
  }

  const todasMesas = await buscarMesasPresenciais();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={pracaSete} alt="" fill priority className="object-cover opacity-30" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        {/* Herói enxuto de propósito: o que a pessoa veio fazer aqui é achar
            mesa, e tudo que fica acima da lista atrasa isso. */}
        <Container className="py-12 sm:py-16">
          <h1 className="titulo-display titulo-pagina max-w-3xl">{t("titulo")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/80">{t("subtitulo")}</p>
          <Link
            href="/mesas/nova?modalidade=presencial"
            className={buttonVariants({ variant: "outline", size: "lg", className: "mt-6 rounded-full" })}
          >
            {t("criarMesa")}
          </Link>
        </Container>
      </section>

      {/*
       * As mesas vêm antes do "como funciona". A maioria de quem chega aqui
       * procura mesa pra jogar, e os três passos falam com quem vai publicar
       * uma — deixá-los no topo empurrava o conteúdo real pra baixo da dobra.
       */}
      <ListaDeMesasPresenciais todasMesas={todasMesas} cidade={null} pagina={sp.pagina} />

      <OutraCidade />
      <ComoPublicar />

      <BlocoFechamento caminhos={["mesas", "eventos", "suplementos"]} />
    </>
  );
}
