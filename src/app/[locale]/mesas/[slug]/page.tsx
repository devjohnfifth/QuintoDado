import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, CalendarDays, CheckCircle2, Clock, Globe, LogIn, MapPin, Repeat, Ticket, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/site/container";
import { Selo } from "@/components/site/selo";
import { BarraAcaoMovel } from "@/components/site/barra-acao-movel";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import { SairDaMesaButton } from "./sair-da-mesa-button";
import {
  TIPO_MESA_LABEL,
  MODALIDADE_LABEL,
  CLASSIFICACAO_LABEL,
  NIVEL_LABEL,
  FREQUENCIA_LABEL,
  limiteIdadeClassificacao,
} from "@/lib/mesas/labels";
import { dataFimPrevista } from "@/lib/mesas/horario";
import { jsonLdSeguro } from "@/lib/json-ld";
import { idadeEmAnos } from "@/lib/idade";
import { CandidaturaForm } from "./candidatura-form";
import { ShareButton } from "./share-button";
import { SinopseExpansivel } from "./sinopse-expansivel";
import bannerOg from "@/assets/brand/banner-og.webp";

type MesaDetalhe = {
  id: string;
  titulo: string;
  sinopse: string;
  modalidade: "online" | "presencial";
  cidade_uf: string | null;
  tipo: string;
  classificacao: string;
  nivel_experiencia: string;
  preco_centavos: number;
  frequencia: string;
  qtd_sessoes: number | null;
  data_inicio: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_total: number;
  sistemas: { nome: string } | null;
  sistema_outro: string | null;
  mestre_id: string;
  profiles: { nome_exibicao: string; avatar_url: string | null } | null;
  vagas_preenchidas: number;
  banner_url: string | null;
  jogadores_aprovados: { nome: string; avatar_url: string | null }[] | null;
  evento_id: string | null;
  eventos: { slug: string; titulo: string } | null;
};

async function buscarMesa(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: mesa } = await supabase
    .from("mesas")
    .select(
      "id, titulo, sinopse, modalidade, cidade_uf, tipo, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, horario_fim, vagas_total, sistemas(nome), sistema_outro, mestre_id, profiles!mesas_mestre_id_fkey(nome_exibicao, avatar_url), vagas_preenchidas, banner_url, jogadores_aprovados, evento_id, eventos(slug, titulo)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!mesa) return null;

  const { data: perguntas } = await supabase
    .from("mesa_perguntas")
    .select("id, enunciado, tipo, opcoes, obrigatoria, ordem")
    .eq("mesa_id", mesa.id)
    .order("ordem");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mesaTyped = mesa as unknown as MesaDetalhe;

  let inscricao: { id: string; status: string } | null = null;
  let idadeInsuficiente = false;
  let ingressoEventoAprovado = false;
  if (user) {
    const [{ data: inscricaoData }, { data: perfil }, { data: ingressoData }] = await Promise.all([
      supabase
        .from("inscricoes")
        .select("id, status")
        .eq("mesa_id", mesa.id)
        .eq("usuario_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("data_nascimento").eq("id", user.id).single(),
      mesaTyped.evento_id
        ? supabase
            .from("evento_ingressos")
            .select("status")
            .eq("evento_id", mesaTyped.evento_id)
            .eq("usuario_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    inscricao = inscricaoData;
    ingressoEventoAprovado = ingressoData?.status === "aprovado";

    const limite = limiteIdadeClassificacao(mesa.classificacao);
    const idade = perfil ? idadeEmAnos(perfil.data_nascimento) : -1;
    idadeInsuficiente = limite > 0 && idade < limite;
  }

  return {
    mesa: mesaTyped,
    perguntas: perguntas ?? [],
    logado: Boolean(user),
    inscricao,
    idadeInsuficiente,
    ehMestre: Boolean(user && user.id === mesaTyped.mestre_id),
    ingressoEventoAprovado,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const resultado = await buscarMesa(slug);
  if (!resultado) return { title: "Mesa não encontrada — Quinto Dado" };

  const { mesa } = resultado;
  const sistema = mesa.sistema_outro || mesa.sistemas?.nome;
  const title = `${mesa.titulo} — Quinto Dado`;
  const description = sistema ? `${mesa.sinopse} Sistema: ${sistema}.` : mesa.sinopse;
  const imagem = mesa.banner_url
    ? [{ url: mesa.banner_url, width: 1200, height: 514 }]
    : [{ url: bannerOg.src, width: bannerOg.width, height: bannerOg.height }];

  return {
    title,
    description,
    alternates: { canonical: `/mesas/${slug}` },
    openGraph: { title, description, locale, type: "website", images: imagem },
    twitter: { card: "summary_large_image", title, description, images: imagem.map((i) => i.url) },
  };
}

export default async function MesaDetalhePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Mesas");

  const resultado = await buscarMesa(slug);
  if (!resultado) notFound();
  const { mesa, perguntas, logado, inscricao, idadeInsuficiente, ehMestre, ingressoEventoAprovado } = resultado;

  const dataFormatada = new Date(`${mesa.data_inicio}T${mesa.horario_inicio}`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  const fimPrevisto = dataFimPrevista(mesa);

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: mesa.titulo,
    description: mesa.sinopse,
    startDate: `${mesa.data_inicio}T${mesa.horario_inicio}`,
    endDate: `${mesa.data_inicio}T${mesa.horario_fim}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      mesa.modalidade === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      mesa.modalidade === "online"
        ? { "@type": "VirtualLocation", url: `${site}/mesas/${slug}` }
        : {
            "@type": "Place",
            name: mesa.cidade_uf ?? "Belo Horizonte",
            address: mesa.cidade_uf ?? "Belo Horizonte, MG",
          },
    image: mesa.banner_url ? [mesa.banner_url] : [`${site}${bannerOg.src}`],
    organizer: { "@type": "Person", name: "Mestre Quintão", url: site },
    offers: {
      "@type": "Offer",
      price: (mesa.preco_centavos / 100).toFixed(2),
      priceCurrency: "BRL",
      availability:
        mesa.vagas_preenchidas < mesa.vagas_total
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: `${site}/mesas/${slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbInicio"), item: site },
      { "@type": "ListItem", position: 2, name: t("breadcrumbMesas"), item: `${site}/mesas` },
      { "@type": "ListItem", position: 3, name: mesa.titulo, item: `${site}/mesas/${slug}` },
    ],
  };

  const vagasLivres = Math.max(0, mesa.vagas_total - mesa.vagas_preenchidas);
  const lotada = vagasLivres === 0;
  const ocupacao = mesa.vagas_total > 0 ? Math.min(100, Math.round((mesa.vagas_preenchidas / mesa.vagas_total) * 100)) : 0;
  const diaSemana = new Date(`${mesa.data_inicio}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });
  const preco = mesa.preco_centavos === 0 ? t("gratuita") : formatBRL(mesa.preco_centavos);
  const jogadores = mesa.jogadores_aprovados ?? [];

  // A ação principal da página, decidida uma vez e usada no cartão de resumo
  // e na barra fixa do celular. `null` = não há o que fazer (só mostra o status).
  const podeCandidatar =
    logado && !ehMestre && !inscricao && !idadeInsuficiente && !(mesa.eventos && !ingressoEventoAprovado) && !lotada;
  const acaoPrincipal = ehMestre ? null : !logado ? (
    <Link
      href={{ pathname: "/entrar", query: { next: `/mesas/${slug}` } }}
      className={buttonVariants({ variant: "marca", size: "lg", className: "w-full" })}
    >
      <LogIn className="size-4" aria-hidden />
      {t("entrarPraCandidatar")}
    </Link>
  ) : podeCandidatar ? (
    <a href="#candidatura" className={buttonVariants({ variant: "marca", size: "lg", className: "w-full" })}>
      <UserPlus className="size-4" aria-hidden />
      {t("candidatar")}
    </a>
  ) : null;
  const statusResumo = ehMestre
    ? t("voceMestra")
    : inscricao?.status === "aprovado"
      ? t("confirmadoNaMesa")
      : inscricao
        ? t("candidaturaEnviada")
        : null;

  return (
    <article className={acaoPrincipal ? "pb-24 sm:pb-0" : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd) }} />

      <Container className="py-10 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">
            {t("breadcrumbInicio")}
          </Link>
          <span aria-hidden>/</span>
          <Link href="/mesas" className="hover:text-foreground hover:underline">
            {t("breadcrumbMesas")}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-foreground/80">{mesa.titulo}</span>
        </nav>

        {mesa.banner_url && (
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
            <Image
              src={mesa.banner_url}
              alt={mesa.titulo}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 768px, 100vw"
              priority
            />
          </div>
        )}

        <div className="mt-6 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Selo>{mesa.sistema_outro || mesa.sistemas?.nome || "—"}</Selo>
            <Selo tom="neutro">{TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}</Selo>
            {mesa.eventos && (
              <Link href={`/eventos/${mesa.eventos.slug}`} className="hover:underline">
                <Selo tom="solido" icone={CalendarDays}>
                  {t("mesaDoEvento", { evento: mesa.eventos.titulo })}
                </Selo>
              </Link>
            )}
          </div>
          <ShareButton titulo={mesa.titulo} url={`${site}/mesas/${slug}`} />
        </div>

        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{mesa.titulo}</h1>
        {mesa.profiles?.nome_exibicao && (
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            {mesa.profiles.avatar_url ? (
              <Image
                src={mesa.profiles.avatar_url}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-marca text-xs font-bold text-white">
                {mesa.profiles.nome_exibicao.charAt(0).toUpperCase()}
              </span>
            )}
            {t("mestradoPor", { nome: mesa.profiles.nome_exibicao })}
          </p>
        )}

        {/* Resumo: o que decide a candidatura, com a ação principal ao lado. */}
        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-heading text-3xl font-bold text-primary">{preco}</p>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="first-letter:uppercase">
                    {diaSemana}, {dataFormatada}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                  {mesa.horario_inicio.slice(0, 5)}–{mesa.horario_fim.slice(0, 5)}
                </li>
                <li className="flex items-center gap-2">
                  {mesa.modalidade === "online" ? (
                    <Globe className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  )}
                  {MODALIDADE_LABEL[mesa.modalidade]}
                  {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` · ${mesa.cidade_uf}` : ""}
                </li>
                <li className="flex items-center gap-2">
                  <Repeat className="size-4 shrink-0 text-primary" aria-hidden />
                  {FREQUENCIA_LABEL[mesa.frequencia] ?? mesa.frequencia}
                  {mesa.qtd_sessoes ? ` · ${t("sessoes", { n: mesa.qtd_sessoes })}` : ""}
                </li>
              </ul>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("vagasPreenchidas", { preenchidas: mesa.vagas_preenchidas, total: mesa.vagas_total })}
                  </span>
                  <span className={lotada ? "text-muted-foreground" : "font-medium text-foreground"}>
                    {t("vagasRestantes", { n: vagasLivres })}
                  </span>
                </div>
                <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${lotada ? "bg-muted-foreground" : "bg-marca"}`}
                    style={{ width: `${ocupacao}%` }}
                  />
                </div>
              </div>

              {jogadores.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    {jogadores.map((jogador, i) =>
                      jogador.avatar_url ? (
                        <Image
                          key={i}
                          src={jogador.avatar_url}
                          alt={jogador.nome}
                          width={36}
                          height={36}
                          className="size-9 rounded-full border-2 border-background object-cover"
                        />
                      ) : (
                        <span
                          key={i}
                          className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-marca text-sm font-bold text-white"
                          title={jogador.nome}
                        >
                          {jogador.nome.charAt(0).toUpperCase()}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t("confirmados")}</p>
                </div>
              )}
            </div>

            {(acaoPrincipal || statusResumo) && (
              <div className="sm:w-64 sm:shrink-0">
                {acaoPrincipal}
                {statusResumo && (
                  <p className="flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 text-center text-sm font-medium text-primary">
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                    {statusResumo}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-4">
          <SinopseExpansivel texto={mesa.sinopse} />
        </div>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-bold">{t("detalhes")}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card/60 p-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("encerramento")}</dt>
              <dd className="font-medium">
                {mesa.tipo === "campanha"
                  ? t("campanhaAberta")
                  : fimPrevisto
                    ? t("porVoltaDe", { data: new Date(`${fimPrevisto}T00:00:00`).toLocaleDateString("pt-BR") })
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("classificacao")}</dt>
              <dd className="font-medium">{CLASSIFICACAO_LABEL[mesa.classificacao]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("nivel")}</dt>
              <dd className="font-medium">{NIVEL_LABEL[mesa.nivel_experiencia]}</dd>
            </div>
          </dl>
        </section>

        {!ehMestre && logado && (
          <section id="candidatura" className="mt-10 scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold">{t("candidatar")}</h2>

            {inscricao?.status === "aprovado" ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-5 text-sm">
                <p>{t("confirmadoNaMesa")}</p>
                <SairDaMesaButton inscricaoId={inscricao.id} slug={slug} />
              </div>
            ) : inscricao ? (
              <p className="mt-4 rounded-2xl border border-border bg-card/60 p-5 text-sm">{t("jaCandidatado")}</p>
            ) : idadeInsuficiente ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                {t("idadeInsuficiente", { classificacao: CLASSIFICACAO_LABEL[mesa.classificacao] })}
              </p>
            ) : mesa.eventos && !ingressoEventoAprovado ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <p className="max-w-lg">{t("precisaIngresso", { evento: mesa.eventos.titulo })}</p>
                <Link href={`/eventos/${mesa.eventos.slug}#ingressos`} className={buttonVariants({ variant: "marca" })}>
                  <Ticket className="size-4" aria-hidden />
                  {t("verIngressos")}
                </Link>
              </div>
            ) : lotada ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                {t("mesaLotada")}
              </p>
            ) : (
              <div className="mt-4">
                <CandidaturaForm mesaId={mesa.id} slug={slug} perguntas={perguntas} />
              </div>
            )}
          </section>
        )}
      </Container>

      {acaoPrincipal && <BarraAcaoMovel rotulo={preco} acao={acaoPrincipal} />}
    </article>
  );
}
