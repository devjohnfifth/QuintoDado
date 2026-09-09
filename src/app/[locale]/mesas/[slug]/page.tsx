import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { idadeEmAnos } from "@/lib/idade";
import { CandidaturaForm } from "./candidatura-form";
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
  vagas_total: number;
  sistemas: { nome: string } | null;
  sistema_outro: string | null;
  profiles: { nome_exibicao: string } | null;
  vagas_preenchidas: number;
  banner_url: string | null;
  jogadores_aprovados: { nome: string; avatar_url: string | null }[] | null;
};

async function buscarMesa(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: mesa } = await supabase
    .from("mesas")
    .select(
      "id, titulo, sinopse, modalidade, cidade_uf, tipo, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, vagas_total, sistemas(nome), sistema_outro, profiles!mesas_mestre_id_fkey(nome_exibicao), vagas_preenchidas, banner_url, jogadores_aprovados",
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

  let inscricao: { id: string; status: string } | null = null;
  let idadeInsuficiente = false;
  if (user) {
    const [{ data: inscricaoData }, { data: perfil }] = await Promise.all([
      supabase
        .from("inscricoes")
        .select("id, status")
        .eq("mesa_id", mesa.id)
        .eq("usuario_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("data_nascimento").eq("id", user.id).single(),
    ]);
    inscricao = inscricaoData;

    const limite = limiteIdadeClassificacao(mesa.classificacao);
    const idade = perfil ? idadeEmAnos(perfil.data_nascimento) : -1;
    idadeInsuficiente = limite > 0 && idade < limite;
  }

  return {
    mesa: mesa as unknown as MesaDetalhe,
    perguntas: perguntas ?? [],
    logado: Boolean(user),
    inscricao,
    idadeInsuficiente,
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
  const { mesa, perguntas, logado, inscricao, idadeInsuficiente } = resultado;

  const dataFormatada = new Date(`${mesa.data_inicio}T${mesa.horario_inicio}`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: mesa.titulo,
    description: mesa.sinopse,
    startDate: `${mesa.data_inicio}T${mesa.horario_inicio}`,
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

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {mesa.banner_url && (
        <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={mesa.banner_url}
            alt={mesa.titulo}
            fill
            className="object-cover"
            sizes="(min-width: 672px) 672px, 100vw"
            priority
          />
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {mesa.sistema_outro || mesa.sistemas?.nome || "—"} · {TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}
      </p>
      <h1 className="mt-1 font-heading text-3xl font-bold sm:text-4xl">{mesa.titulo}</h1>
      {mesa.profiles?.nome_exibicao && (
        <p className="mt-1 text-sm text-muted-foreground">
          Mestrado por {mesa.profiles.nome_exibicao}
        </p>
      )}
      <p className="mt-4 text-muted-foreground">{mesa.sinopse}</p>

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card/60 p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{t("modalidade")}</dt>
          <dd className="font-medium">
            {MODALIDADE_LABEL[mesa.modalidade]}
            {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` — ${mesa.cidade_uf}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("data")}</dt>
          <dd className="font-medium">{dataFormatada}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Frequência</dt>
          <dd className="font-medium">
            {FREQUENCIA_LABEL[mesa.frequencia] ?? mesa.frequencia}
            {mesa.qtd_sessoes ? ` (${mesa.qtd_sessoes} sessões)` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("vagasLabel")}</dt>
          <dd className="font-medium">
            {mesa.vagas_preenchidas}/{mesa.vagas_total} preenchidas
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
        <div>
          <dt className="text-muted-foreground">{t("preco")}</dt>
          <dd className="font-medium">
            {mesa.preco_centavos === 0 ? t("gratuita") : formatBRL(mesa.preco_centavos)}
          </dd>
        </div>
      </dl>

      {mesa.jogadores_aprovados && mesa.jogadores_aprovados.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">Quem já confirmou presença</p>
          <div className="mt-2 flex items-center -space-x-2">
            {mesa.jogadores_aprovados.map((jogador, i) =>
              jogador.avatar_url ? (
                <Image
                  key={i}
                  src={jogador.avatar_url}
                  alt={jogador.nome}
                  width={40}
                  height={40}
                  className="size-10 rounded-full border-2 border-background object-cover"
                />
              ) : (
                <span
                  key={i}
                  className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-sm font-bold text-white"
                  title={jogador.nome}
                >
                  {jogador.nome.charAt(0).toUpperCase()}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      <h2 className="mt-10 font-heading text-xl font-bold">{t("candidatar")}</h2>

      {!logado ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t("precisaEntrar")}{" "}
          <Link href="/entrar" className="text-primary hover:underline">
            {t("candidatar")}
          </Link>
        </p>
      ) : inscricao?.status === "aprovado" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-5 text-sm">
          <p>Você está confirmado nessa mesa!</p>
          <SairDaMesaButton inscricaoId={inscricao.id} slug={slug} />
        </div>
      ) : inscricao ? (
        <p className="mt-4 rounded-xl border border-border bg-card/60 p-5 text-sm">
          {t("jaCandidatado")}
        </p>
      ) : idadeInsuficiente ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t("idadeInsuficiente", { classificacao: CLASSIFICACAO_LABEL[mesa.classificacao] })}
        </p>
      ) : (
        <div className="mt-4">
          <CandidaturaForm mesaId={mesa.id} slug={slug} perguntas={perguntas} />
        </div>
      )}
    </article>
  );
}
