import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, MapPin, Ticket, Clock, LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { Container } from "@/components/site/container";
import { FundoSemImagem } from "@/components/site/card-midia";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { BarraAcaoMovel } from "@/components/site/barra-acao-movel";
import { buttonVariants } from "@/components/ui/button";
import { ComprarIngressoButton } from "./comprar-ingresso-button";
import { GaleriaLightbox } from "./galeria-lightbox";
import bannerOg from "@/assets/brand/banner-og.webp";

async function buscarEvento(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select(
      "id, titulo, subtitulo, descricao, banner_url, cidade_uf, local, data_inicio, data_fim, horario_inicio, horario_fim, chave_pix, whatsapp_confirmacao, capacidade_maxima, ingressos_vendidos, vendas_abertas",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) return null;

  const [{ data: tipos }, { data: mesas }, { data: imagens }, { data: apoiadores }, { data: atracoes }, { data: mestresData }] =
    await Promise.all([
      supabase
        .from("evento_ingresso_tipos")
        .select("id, nome, descricao, preco_centavos, limite_mesas, quantidade_maxima, ingressos_vendidos_tipo")
        .eq("evento_id", evento.id)
        .eq("ativo", true)
        .order("ordem"),
      supabase
        .from("mesas")
        .select(
          "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo)",
        )
        .eq("evento_id", evento.id)
        .in("status", ["publicada", "confirmada", "em_andamento"])
        .order("data_inicio"),
      supabase.from("evento_imagens").select("url").eq("evento_id", evento.id).order("ordem"),
      supabase.from("evento_apoiadores").select("nome, logo_url, link").eq("evento_id", evento.id).order("ordem"),
      supabase.from("evento_atracoes").select("horario, titulo, descricao").eq("evento_id", evento.id).order("ordem"),
      supabase
        .from("evento_mestres")
        .select("profiles(nome_exibicao, username, avatar_url, bio)")
        .eq("evento_id", evento.id)
        .order("ordem"),
    ]);

  const mestres = (mestresData ?? [])
    .map(
      (m) =>
        m.profiles as unknown as {
          nome_exibicao: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
        } | null,
    )
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ingressoExistente: { status: string; motivo_recusa: string | null } | null = null;
  let nomeCompletoAtual: string | null = null;
  let telefoneAtual: string | null = null;
  if (user) {
    const [{ data: ingressoData }, { data: perfil }] = await Promise.all([
      supabase
        .from("evento_ingressos")
        .select("status, motivo_recusa")
        .eq("evento_id", evento.id)
        .eq("usuario_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("nome_completo, telefone").eq("id", user.id).single(),
    ]);
    ingressoExistente = ingressoData;
    nomeCompletoAtual = perfil?.nome_completo ?? null;
    telefoneAtual = perfil?.telefone ?? null;
  }

  return {
    evento,
    tipos: tipos ?? [],
    mesas: (mesas ?? []) as unknown as MesaCardData[],
    imagens: (imagens ?? []).map((i) => i.url),
    apoiadores: apoiadores ?? [],
    atracoes: atracoes ?? [],
    mestres,
    logado: Boolean(user),
    ingressoExistente,
    nomeCompletoAtual,
    telefoneAtual,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const resultado = await buscarEvento(slug);
  if (!resultado) return { title: "Evento não encontrado — Quinto Dado" };

  const { evento } = resultado;
  const title = `${evento.titulo} — Quinto Dado`;
  const description = evento.subtitulo || evento.descricao.slice(0, 160);
  const imagem = evento.banner_url
    ? [{ url: evento.banner_url, width: 1200, height: 630 }]
    : [{ url: bannerOg.src, width: bannerOg.width, height: bannerOg.height }];

  return {
    title,
    description,
    alternates: { canonical: `/eventos/${slug}` },
    openGraph: { title, description, locale, type: "website", images: imagem },
    twitter: { card: "summary_large_image", title, description, images: imagem.map((i) => i.url) },
  };
}

export default async function EventoDetalhePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Eventos");
  const resultado = await buscarEvento(slug);
  if (!resultado) notFound();

  const {
    evento,
    tipos,
    mesas,
    imagens,
    apoiadores,
    atracoes,
    mestres,
    logado,
    ingressoExistente,
    nomeCompletoAtual,
    telefoneAtual,
  } = resultado;

  const dataObj = new Date(`${evento.data_inicio}T00:00:00`);
  const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // Pedaços soltos pro bloco de calendário desenhado na capa.
  const semPonto = (txt: string) => txt.replace(".", "");
  const diaNumero = dataObj.toLocaleDateString("pt-BR", { day: "2-digit" });
  const mesCurto = semPonto(dataObj.toLocaleDateString("pt-BR", { month: "short" }));
  const diaSemanaCurto = semPonto(dataObj.toLocaleDateString("pt-BR", { weekday: "short" }));
  const horario = evento.horario_inicio
    ? `${evento.horario_inicio.slice(0, 5)}${evento.horario_fim ? `–${evento.horario_fim.slice(0, 5)}` : ""}`
    : null;
  const esgotado = Boolean(evento.capacidade_maxima && evento.ingressos_vendidos >= evento.capacidade_maxima);
  const menorPreco = tipos.length > 0 ? Math.min(...tipos.map((tp) => tp.preco_centavos)) : null;
  // Botão do topo e barra fixa do celular só quando dá pra comprar de fato.
  const vendaAtiva = evento.vendas_abertas && !esgotado && tipos.length > 0 && !ingressoExistente;
  const statusIngresso: Record<string, string> = {
    pendente: t("statusPendente"),
    aprovado: t("statusAprovado"),
    recusado: t("statusRecusado"),
    cancelado: t("statusCancelado"),
  };

  return (
    <article className={vendaAtiva ? "pb-24 sm:pb-0" : undefined}>
      {/* Capa sangrada, com a data em bloco de calendário ao lado do título:
          num evento, a data é a informação que decide, e ela estava perdida
          no meio de uma fileira de pílulas cinzas. */}
      <section className="textura-grao relative isolate flex min-h-[22rem] items-end overflow-hidden sm:min-h-[28rem]">
        <div aria-hidden className="absolute inset-0 -z-20">
          {evento.banner_url ? (
            <Image src={evento.banner_url} alt="" fill className="object-cover" sizes="100vw" priority />
          ) : (
            <FundoSemImagem chave={slug} />
          )}
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-background/25"
        />

        <Container className="pb-10 pt-20 sm:pb-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex min-w-0 items-end gap-5">
              <div className="painel-alto flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl sm:size-24">
                <span className="rotulo-caps text-muted-foreground">{diaSemanaCurto}</span>
                <span className="titulo-display text-3xl text-primary sm:text-4xl">{diaNumero}</span>
                <span className="rotulo-caps text-muted-foreground">{mesCurto}</span>
              </div>
              <div className="min-w-0">
                <h1 className="titulo-display titulo-pagina">{evento.titulo}</h1>
                {evento.subtitulo && <p className="mt-2 text-lg text-foreground/80">{evento.subtitulo}</p>}
              </div>
            </div>
            {vendaAtiva && (
              <a
                href="#ingressos"
                className={buttonVariants({ variant: "marca", size: "lg", className: "hidden sm:inline-flex" })}
              >
                <Ticket className="size-4" aria-hidden />
                {t("verIngressos")}
              </a>
            )}
          </div>
        </Container>
      </section>

      <Container className="pb-12 pt-10 sm:pb-16">
        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
            <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="first-letter:uppercase">{dataFormatada}</span>
          </li>
          {horario && (
            <li className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden />
              {horario}
            </li>
          )}
          <li className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            {evento.local ? `${evento.local} — ` : ""}
            {evento.cidade_uf}
          </li>
        </ul>

        <p className="mt-6 max-w-3xl whitespace-pre-line text-muted-foreground">{evento.descricao}</p>

        <section id="ingressos" className="mt-12 scroll-mt-24">
          <h2 className="titulo-display titulo-secao flex items-center gap-2.5">
            <Ticket className="size-6 shrink-0 text-primary" aria-hidden />
            {t("ingressos")}
          </h2>

          {/* Lotação do evento: o número existia no banco e não aparecia em
              lugar nenhum pra quem decide comprar. */}
          {evento.capacidade_maxima ? (
            <div className="mt-5 rounded-2xl painel p-4">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {t("lotacao", { vendidos: evento.ingressos_vendidos, total: evento.capacidade_maxima })}
                </span>
                <span className="tabular-nums text-primary">
                  {Math.round((evento.ingressos_vendidos / evento.capacidade_maxima) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-marca"
                  style={{
                    width: `${Math.min(100, Math.round((evento.ingressos_vendidos / evento.capacidade_maxima) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {ingressoExistente ? (
            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-5 text-sm">
              <p className="font-medium">{statusIngresso[ingressoExistente.status] ?? ingressoExistente.status}</p>
              {ingressoExistente.status === "recusado" && ingressoExistente.motivo_recusa && (
                <p className="mt-1 text-muted-foreground">{t("motivo", { motivo: ingressoExistente.motivo_recusa })}</p>
              )}
            </div>
          ) : esgotado ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              {t("esgotado")}
            </p>
          ) : tipos.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              {t("semIngressos")}
            </p>
          ) : (
            <div
              className={`mt-4 grid gap-4 sm:grid-cols-2 ${tipos.length === 2 || tipos.length === 4 ? "" : "lg:grid-cols-3"}`}
            >
              {tipos.map((tipo) => {
                const tipoEsgotado = Boolean(
                  tipo.quantidade_maxima && tipo.ingressos_vendidos_tipo >= tipo.quantidade_maxima,
                );
                // Quantos ainda cabem neste tipo. Só vira aviso quando está
                // acabando — "restam 40" não apressa ninguém.
                const restamTipo =
                  tipo.quantidade_maxima !== null && tipo.quantidade_maxima !== undefined
                    ? tipo.quantidade_maxima - tipo.ingressos_vendidos_tipo
                    : null;
                const acabando = restamTipo !== null && restamTipo > 0 && restamTipo <= 10;
                return (
                  <div key={tipo.id} className="relative flex flex-col rounded-2xl painel-alto p-5">
                    {/* Picote de ingresso, igual ao card de mesa: duas
                        mordidas e a linha tracejada separando o talão. */}
                    <span aria-hidden className="absolute -left-3 top-24 size-6 rounded-full bg-background" />
                    <span aria-hidden className="absolute -right-3 top-24 size-6 rounded-full bg-background" />

                    <p className="titulo-display titulo-bloco">{tipo.nome}</p>
                    {tipo.descricao && <p className="mt-1 text-sm text-muted-foreground">{tipo.descricao}</p>}

                    <span aria-hidden className="my-4 border-t-2 border-dashed border-border/70" />

                    <p className="titulo-display text-4xl text-primary">{formatBRL(tipo.preco_centavos)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tipo.limite_mesas ? t("limiteMesas", { n: tipo.limite_mesas }) : t("qualquerMesa")}
                    </p>
                    {acabando && (
                      <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {t("restamIngressos", { n: restamTipo })}
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      {!evento.vendas_abertas ? (
                        <p className="rounded-full border border-dashed border-border px-3 py-2.5 text-center text-sm text-muted-foreground">
                          {t("vendasFechadas")}
                        </p>
                      ) : tipoEsgotado ? (
                        <p className="rounded-full border border-dashed border-border px-3 py-2.5 text-center text-sm text-muted-foreground">
                          {t("tipoEsgotado")}
                        </p>
                      ) : !logado ? (
                        <Link
                          href={{ pathname: "/entrar", query: { next: `/eventos/${slug}` } }}
                          className={buttonVariants({ variant: "marca", className: "w-full" })}
                        >
                          <LogIn className="size-4" aria-hidden />
                          {t("entrarPraComprar")}
                        </Link>
                      ) : (
                        <ComprarIngressoButton
                          eventoId={evento.id}
                          tipoId={tipo.id}
                          tipoNome={tipo.nome}
                          precoCentavos={tipo.preco_centavos}
                          slug={slug}
                          chavePix={evento.chave_pix}
                          whatsappConfirmacao={evento.whatsapp_confirmacao}
                          nomeCompletoAtual={nomeCompletoAtual}
                          telefoneAtual={telefoneAtual}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {(atracoes.length > 0 || mestres.length > 0) && (
          <div className={`mt-12 gap-8 ${atracoes.length > 0 && mestres.length > 0 ? "grid sm:grid-cols-3" : ""}`}>
            {atracoes.length > 0 && (
              <section className={mestres.length > 0 ? "sm:col-span-2" : ""}>
                <h2 className="font-heading text-2xl font-bold">{t("programacao")}</h2>
                <ol className="mt-4 space-y-4 border-l-2 border-primary/30 pl-4">
                  {atracoes.map((a, i) => (
                    <li key={i}>
                      {a.horario && (
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <Clock className="size-3.5 shrink-0" aria-hidden />
                          {a.horario}
                        </p>
                      )}
                      <p className="font-medium">{a.titulo}</p>
                      {a.descricao && <p className="text-sm text-muted-foreground">{a.descricao}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {mestres.length > 0 && (
              <section className={atracoes.length > 0 ? "sm:col-span-1" : ""}>
                <h2 className="font-heading text-2xl font-bold">{t("mestres")}</h2>
                <ul className="mt-4 grid gap-3">
                  {mestres.map((m) => (
                    <li key={m.username} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
                      {m.avatar_url ? (
                        <Image
                          src={m.avatar_url}
                          alt={m.nome_exibicao}
                          width={44}
                          height={44}
                          className="size-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-marca text-sm font-bold text-white">
                          {m.nome_exibicao.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{m.nome_exibicao}</p>
                        <p className="truncate text-sm text-muted-foreground">{m.bio || `@${m.username}`}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {mesas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold">{t("mesasDoEvento")}</h2>
            <div className="mt-4">
              <GradeAdaptavel
                itens={mesas}
                chave={(m) => m.slug}
                colunas="sm:grid-cols-2"
                render={(mesa, destaque) => <MesaCard mesa={mesa} destaque={destaque} />}
              />
            </div>
          </section>
        )}

        {imagens.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold">{t("galeria")}</h2>
            <GaleriaLightbox imagens={imagens} />
          </section>
        )}

        {apoiadores.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold">{t("apoiadores")}</h2>
            <ul className="mt-4 flex flex-wrap items-center gap-4">
              {apoiadores.map((a, i) => {
                const logo = (
                  <Image
                    src={a.logo_url}
                    alt={a.nome}
                    width={72}
                    height={72}
                    className="size-16 rounded-lg border border-border object-cover"
                  />
                );
                return (
                  <li key={i}>
                    {a.link ? (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={a.nome}
                        className="block transition-opacity hover:opacity-80"
                      >
                        {logo}
                      </a>
                    ) : (
                      <span title={a.nome}>{logo}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </Container>

      {vendaAtiva && menorPreco !== null && (
        <BarraAcaoMovel
          rotulo={t("aPartirDe", { preco: formatBRL(menorPreco) })}
          acao={
            <a href="#ingressos" className={buttonVariants({ variant: "marca" })}>
              <Ticket className="size-4" aria-hidden />
              {t("verIngressos")}
            </a>
          }
        />
      )}
    </article>
  );
}
