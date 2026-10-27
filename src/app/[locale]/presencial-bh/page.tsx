import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import pracaSete from "@/assets/presencial-bh/praca-sete.webp";
import capivaraAventureiro from "@/assets/brand/capivara-aventureiro.webp";
import { Container } from "@/components/site/container";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { buttonVariants } from "@/components/ui/button";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "RPG de mesa presencial em Belo Horizonte — Quinto Dado";
  const description =
    "Mesas presenciais de RPG em BH, criadas por mestres cadastrados no Quinto Dado. Grátis ou com valor combinado pra handouts.";

  return {
    title,
    description,
    alternates: { canonical: "/presencial-bh" },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: pracaSete.src, width: pracaSete.width, height: pracaSete.height }],
    },
  };
}

async function buscarMesasPresenciaisBh(): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[/presencial-bh] Supabase não configurado — mostrando estado vazio (ver .env.example).",
    );
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo)",
    )
    .eq("modalidade", "presencial")
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .ilike("cidade_uf", "%belo horizonte%")
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/presencial-bh] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaCardData[];
}

/** Quantas mesas por página — 12 fecha quatro fileiras de três. */
const POR_PAGINA = 12;

export default async function PresencialBhPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PresencialBh");
  const sp = await searchParams;
  const todasMesas = await buscarMesasPresenciaisBh();
  const { pagina, totalPaginas, fatia: mesas } = fatiar(todasMesas, sp.pagina, POR_PAGINA);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={pracaSete}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <Container className="py-16 sm:py-24">
          {/* O aventureiro com a capivara, o pão de queijo e o café é o
              símbolo do presencial em BH — é o que dá rosto à página. */}
          <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
            <div className="text-center md:text-left">
              <h1 className="titulo-display titulo-pagina">{t("titulo")}</h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/80 md:mx-0">{t("subtitulo")}</p>
              <Link
                href="/presencial-bh/nova"
                className={buttonVariants({ variant: "marca", size: "lg", className: "mt-8" })}
              >
                {t("criarMesa")}
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-xs md:max-w-sm">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-full bg-acento/20 blur-3xl"
              />
              <Image
                src={capivaraAventureiro}
                alt={t("ilustracaoAlt")}
                priority
                className="w-full rounded-3xl border border-border/60 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]"
                sizes="(min-width: 768px) 384px, 320px"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="pb-20">
        {/* Três passos numerados no lugar de um parágrafo corrido: o texto
            respondia as mesmas perguntas, mas era fácil de pular. */}
        <section>
          <h2 className="rotulo-caps text-muted-foreground">{t("comoFunciona")}</h2>
          <ol className="cascata mt-5 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-2xl painel p-5">
                <span className="flex size-10 items-center justify-center rounded-xl border border-acento/50 bg-acento/10 font-heading font-bold tabular-nums text-acento">
                  {n}
                </span>
                <h3 className="titulo-display titulo-bloco mt-4">{t(`passo${n}Titulo`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`passo${n}Corpo`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8">
          {mesas.length === 0 ? (
            <EstadoVazio icone={MapPin} titulo={t("vazioTitulo")} corpo={t("vazioCorpo")} />
          ) : (
            <>
              <GradeAdaptavel
                itens={mesas}
                chave={(m) => m.slug}
                render={(mesa, destaque) => <MesaCard mesa={mesa} destaque={destaque} />}
              />
              <Paginacao caminho="/presencial-bh" pagina={pagina} totalPaginas={totalPaginas} />
            </>
          )}
        </div>
      </Container>

      <BlocoFechamento caminhos={["mesas", "eventos", "suplementos"]} />
    </>
  );
}
