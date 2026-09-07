import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import {
  TIPO_MESA_LABEL,
  MODALIDADE_LABEL,
  CLASSIFICACAO_LABEL,
  NIVEL_LABEL,
  FREQUENCIA_LABEL,
} from "@/lib/mesas/labels";
import { CandidaturaForm } from "./candidatura-form";

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
  profiles: { nome_exibicao: string } | null;
  inscricoes: { count: number }[];
};

async function buscarMesa(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: mesa } = await supabase
    .from("mesas")
    .select(
      "id, titulo, sinopse, modalidade, cidade_uf, tipo, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, vagas_total, sistemas(nome), profiles!mesas_mestre_id_fkey(nome_exibicao), inscricoes(count)",
    )
    .eq("inscricoes.status", "aprovado")
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

  let inscricao: { status: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("inscricoes")
      .select("status")
      .eq("mesa_id", mesa.id)
      .eq("usuario_id", user.id)
      .maybeSingle();
    inscricao = data;
  }

  return {
    mesa: mesa as unknown as MesaDetalhe,
    perguntas: perguntas ?? [],
    logado: Boolean(user),
    inscricao,
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
  const title = `${mesa.titulo} — Quinto Dado`;
  return {
    title,
    description: mesa.sinopse,
    openGraph: { title, description: mesa.sinopse, locale, type: "website" },
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
  const { mesa, perguntas, logado, inscricao } = resultado;

  const dataFormatada = new Date(`${mesa.data_inicio}T${mesa.horario_inicio}`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {mesa.sistemas?.nome ?? "—"} · {TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}
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
            {mesa.inscricoes[0]?.count ?? 0}/{mesa.vagas_total} preenchidas
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

      <h2 className="mt-10 font-heading text-xl font-bold">{t("candidatar")}</h2>

      {!logado ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t("precisaEntrar")}{" "}
          <Link href="/entrar" className="text-primary hover:underline">
            {t("candidatar")}
          </Link>
        </p>
      ) : inscricao ? (
        <p className="mt-4 rounded-xl border border-border bg-card/60 p-5 text-sm">
          {t("jaCandidatado")}
        </p>
      ) : (
        <div className="mt-4">
          <CandidaturaForm mesaId={mesa.id} slug={slug} perguntas={perguntas} />
        </div>
      )}
    </article>
  );
}
