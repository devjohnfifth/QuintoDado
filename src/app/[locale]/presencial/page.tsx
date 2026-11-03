import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SITE_LINKS } from "@/lib/site-links";
import pracaSete from "@/assets/presencial/praca-sete.webp";
import capivaraAventureiro from "@/assets/brand/capivara-aventureiro.webp";
import { Container } from "@/components/site/container";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { FiltroCidades } from "@/components/site/filtro-cidades";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { minhasInscricoes } from "@/lib/mesas/minhas-inscricoes";
import { CIDADES_PRESENCIAIS, SLUG_CIDADE, cidadeDoSlug } from "@/lib/mesas/cidades";
import { buttonVariants } from "@/components/ui/button";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "RPG de mesa presencial: BH, SP, Rio, Fortaleza e Curitiba — Quinto Dado";
  const description =
    "Mesas presenciais de RPG em Belo Horizonte, São Paulo, Rio de Janeiro, Fortaleza e Curitiba, criadas por mestres cadastrados no Quinto Dado. Grátis ou com valor combinado pra handouts.";

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

async function buscarMesasPresenciais(): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[/presencial] Supabase não configurado — mostrando estado vazio (ver .env.example).");
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "id, slug, titulo, sinopse, tipo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, link_externo, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo), profiles!mesas_mestre_id_fkey(nome_exibicao, avatar_url)",
    )
    .eq("modalidade", "presencial")
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .in("cidade_uf", [...CIDADES_PRESENCIAIS])
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/presencial] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaCardData[];
}

/** Quantas mesas por página. */
const POR_PAGINA = 12;

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
  const t = await getTranslations("PresencialBh");
  const sp = await searchParams;

  const todasMesas = await buscarMesasPresenciais();
  // A contagem por cidade sai do conjunto inteiro, não da fatia filtrada:
  // os chips precisam mostrar quanta mesa existe em cada cidade mesmo
  // enquanto você está olhando uma só.
  const contagem = todasMesas.reduce<Record<string, number>>((acc, m) => {
    if (m.cidade_uf) acc[m.cidade_uf] = (acc[m.cidade_uf] ?? 0) + 1;
    return acc;
  }, {});
  const cidadesComMesa = CIDADES_PRESENCIAIS.filter((c) => (contagem[c] ?? 0) > 0);

  const cidade = cidadeDoSlug(sp.cidade);
  const filtradas = cidade ? todasMesas.filter((m) => m.cidade_uf === cidade) : todasMesas;
  const { pagina, totalPaginas, fatia: mesas } = fatiar(filtradas, sp.pagina, POR_PAGINA);
  const situacoes = await minhasInscricoes(mesas.map((m) => m.id ?? ""));

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={pracaSete} alt="" fill priority className="object-cover opacity-30" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <Container className="py-14 sm:py-20">
          {/* O aventureiro com a capivara, o pão de queijo e o café é o que
              dá rosto à página. */}
          <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
            <div className="text-center md:text-left">
              <h1 className="titulo-display titulo-pagina">{t("titulo")}</h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-foreground/80 md:mx-0">{t("subtitulo")}</p>
              <Link
                href="/presencial/nova"
                className={buttonVariants({ variant: "outline", size: "lg", className: "mt-7 rounded-full" })}
              >
                {t("criarMesa")}
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-xs md:max-w-sm">
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-3xl" />
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

      {/*
       * As mesas vêm antes do "como funciona". A maioria de quem chega aqui
       * procura mesa pra jogar, e os três passos falam com quem vai publicar
       * uma — deixá-los no topo empurrava o conteúdo real pra baixo da dobra.
       */}
      <Container className="pb-16">
        <FiltroCidades contagem={contagem} selecionada={cidade} total={todasMesas.length} />

        {filtradas.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {cidade
              ? t("resumoCidade", { mesas: filtradas.length, cidade })
              : t("resumo", { mesas: todasMesas.length, cidades: cidadesComMesa.length })}
          </p>
        )}

        <div className="mt-6">
          {mesas.length === 0 ? (
            /* Vazio com a cidade no texto: dizer "nenhuma mesa publicada"
               enquanto existem mesas em outras cidades seria mentira. */
            <EstadoVazio
              icone={MapPin}
              titulo={cidade ? t("vazioCidadeTitulo", { cidade }) : t("vazioTitulo")}
              corpo={cidade ? t("vazioCidadeCorpo", { cidade }) : t("vazioCorpo")}
              acao={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {cidade && (
                    <Link href="/presencial" className={buttonVariants({ variant: "marca" })}>
                      {t("verTodasCidades")}
                    </Link>
                  )}
                  <a
                    href={SITE_LINKS.whatsappComunidade}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", className: "rounded-full" })}
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    {t("criarMesa")}
                  </a>
                </div>
              }
            />
          ) : (
            <>
              <GradeAdaptavel
                itens={mesas}
                chave={(m) => m.slug}
                variante="lista"
                render={(mesa) => (
                  <MesaCard mesa={mesa} situacao={mesa.id ? situacoes.get(mesa.id) : undefined} />
                )}
              />
              <Paginacao
                caminho="/presencial"
                pagina={pagina}
                totalPaginas={totalPaginas}
                filtros={{ cidade: cidade ? SLUG_CIDADE[cidade] : undefined }}
              />
            </>
          )}
        </div>
      </Container>

      {/* Agora sim, a parte que fala com quem mestra. */}
      <section className="relative border-t border-border/60 py-16">
        <Container>
          <h2 className="titulo-display titulo-secao">{t("comoFuncionaTitulo")}</h2>
          <ol className="cascata mt-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-2xl painel p-5">
                <span className="flex size-10 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 font-heading font-bold tabular-nums text-primary">
                  {n}
                </span>
                <h3 className="titulo-display titulo-bloco mt-4">{t(`passo${n}Titulo`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`passo${n}Corpo`)}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/presencial/nova"
            className={buttonVariants({ variant: "marca", size: "lg", className: "mt-7" })}
          >
            {t("criarMesa")}
          </Link>
        </Container>
      </section>

      <BlocoFechamento caminhos={["mesas", "eventos", "suplementos"]} />
    </>
  );
}
