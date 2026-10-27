import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SITE_LINKS } from "@/lib/site-links";
import { EventoCard, type EventoCardData } from "@/components/site/evento-card";
import { Container } from "@/components/site/container";
import { CapaPagina } from "@/components/site/capa-pagina";
import { Reveal } from "@/components/site/reveal";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { Paginacao, intervalo } from "@/components/site/paginacao";
import { buttonVariants } from "@/components/ui/button";
import uaiventuraSalao from "@/assets/eventos/uaiventura-salao.webp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Eventos" });
  const title = t("metaTitulo");
  const description = t("metaDescricao");
  return {
    title,
    description,
    alternates: { canonical: "/eventos" },
    openGraph: { title, description, locale, type: "website" },
  };
}

/** Quantos eventos por página. */
const POR_PAGINA = 12;

/** Aqui a paginação é no banco: a lista não alimenta filtro nenhum, então não
 *  há motivo pra trazer tudo pra memória. */
async function buscarEventos(inicio: number, fim: number): Promise<{ eventos: EventoCardData[]; total: number }> {
  if (!isSupabaseConfigured()) return { eventos: [], total: 0 };

  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("eventos")
    .select("slug, titulo, subtitulo, cidade_uf, data_inicio, banner_url, evento_ingresso_tipos(preco_centavos)", {
      count: "exact",
    })
    .eq("status", "publicado")
    .order("data_inicio", { ascending: true })
    .range(inicio, fim);

  if (error) {
    console.error("[/eventos] erro ao buscar eventos:", error.message);
    return { eventos: [], total: 0 };
  }

  return { eventos: (data ?? []) as unknown as EventoCardData[], total: count ?? 0 };
}

export default async function EventosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Eventos");
  const sp = await searchParams;
  const { pagina, inicio, fim } = intervalo(sp.pagina, POR_PAGINA);
  const { eventos, total } = await buscarEventos(inicio, fim);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const vazio = eventos.length === 0;

  return (
    <>
      {/* Sem foto na capa: a mesma imagem já abre o bloco logo abaixo, e
          repetir só empilhava duas fotos iguais em sequência. A capa se
          apoia na trama de d20, como em /suplementos. */}
      <CapaPagina icone={CalendarDays} titulo={t("titulo")} subtitulo={t("subtitulo")} />
      <Container className="py-12">
        <div>
          {vazio ? (
            /* Sem evento aberto, a página era uma caixinha cinza solta no meio
               de uma tela preta. Agora o "não tem agora" ocupa a tela e leva
               pro grupo, que é onde o próximo evento é anunciado primeiro. */
            <Reveal className="painel-alto textura-grao relative overflow-hidden rounded-3xl">
              {/* Foto real do UAIventura: a página de eventos mostrando um
                  evento que aconteceu de verdade vale mais que banco de
                  imagem, mesmo quando não há nada aberto. */}
              <Image
                src={uaiventuraSalao}
                alt=""
                fill
                className="-z-10 object-cover opacity-30"
                sizes="(min-width: 1024px) 768px, 100vw"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_50%_30%,transparent,var(--qd-fundo)_85%)]"
              />
              <div className="px-6 py-16 text-center sm:px-10 sm:py-20">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <CalendarDays className="size-7" aria-hidden />
                </div>
                <h2 className="titulo-display titulo-secao mt-5">{t("vazioTitulo")}</h2>
                <p className="mx-auto mt-3 max-w-xl text-lg text-foreground/80">{t("vazioCorpo")}</p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={SITE_LINKS.whatsappComunidade}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "marca", size: "lg", className: "w-full sm:w-auto" })}
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    {t("vazioCta")}
                  </a>
                  <Link
                    href="/mesas"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "w-full rounded-full bg-background/60 sm:w-auto",
                    })}
                  >
                    {t("vazioSecundario")}
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <GradeAdaptavel
                itens={eventos}
                chave={(e) => e.slug}
                render={(evento, destaque) => <EventoCard evento={evento} destaque={destaque} />}
              />
              <Paginacao caminho="/eventos" pagina={pagina} totalPaginas={totalPaginas} />
            </>
          )}
        </div>
      </Container>

      <BlocoFechamento caminhos={vazio ? ["presencial", "mesas", "suplementos"] : ["presencial", "mesas", "sobre"]} />
    </>
  );
}
