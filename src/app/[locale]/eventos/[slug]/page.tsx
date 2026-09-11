import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { ComprarIngressoButton } from "./comprar-ingresso-button";
import bannerOg from "@/assets/brand/banner-og.webp";

const STATUS_INGRESSO_LABEL: Record<string, string> = {
  pendente: "Pendente — aguardando você mandar o comprovante ser conferido.",
  aprovado: "Aprovado! Te esperamos lá.",
  recusado: "Não aprovado.",
  cancelado: "Cancelado.",
};

async function buscarEvento(slug: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select(
      "id, titulo, subtitulo, descricao, banner_url, cidade_uf, local, data_inicio, data_fim, horario_inicio, horario_fim, chave_pix, whatsapp_confirmacao, capacidade_maxima, ingressos_vendidos",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) return null;

  const [{ data: tipos }, { data: mesas }] = await Promise.all([
    supabase
      .from("evento_ingresso_tipos")
      .select("id, nome, descricao, preco_centavos, limite_mesas")
      .eq("evento_id", evento.id)
      .eq("ativo", true)
      .order("ordem"),
    supabase
      .from("mesas")
      .select(
        "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados",
      )
      .eq("evento_id", evento.id)
      .in("status", ["publicada", "confirmada", "em_andamento"])
      .order("data_inicio"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ingressoExistente: { status: string; motivo_recusa: string | null } | null = null;
  let nomeCompletoAtual: string | null = null;
  if (user) {
    const [{ data: ingressoData }, { data: perfil }] = await Promise.all([
      supabase
        .from("evento_ingressos")
        .select("status, motivo_recusa")
        .eq("evento_id", evento.id)
        .eq("usuario_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("nome_completo").eq("id", user.id).single(),
    ]);
    ingressoExistente = ingressoData;
    nomeCompletoAtual = perfil?.nome_completo ?? null;
  }

  return {
    evento,
    tipos: tipos ?? [],
    mesas: (mesas ?? []) as unknown as MesaCardData[],
    logado: Boolean(user),
    ingressoExistente,
    nomeCompletoAtual,
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
  const { slug } = await params;
  const resultado = await buscarEvento(slug);
  if (!resultado) notFound();

  const { evento, tipos, mesas, logado, ingressoExistente, nomeCompletoAtual } = resultado;

  const dataFormatada = new Date(`${evento.data_inicio}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const esgotado = Boolean(
    evento.capacidade_maxima && evento.ingressos_vendidos >= evento.capacidade_maxima,
  );

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {evento.banner_url && (
        <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={evento.banner_url}
            alt={evento.titulo}
            fill
            className="object-cover"
            sizes="(min-width: 672px) 672px, 100vw"
            priority
          />
        </div>
      )}

      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{evento.titulo}</h1>
      {evento.subtitulo && <p className="mt-1 text-muted-foreground">{evento.subtitulo}</p>}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
          {dataFormatada}
          {evento.horario_inicio ? ` · ${evento.horario_inicio.slice(0, 5)}` : ""}
          {evento.horario_fim ? `–${evento.horario_fim.slice(0, 5)}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          {evento.local ? `${evento.local} — ` : ""}
          {evento.cidade_uf}
        </span>
      </div>

      <p className="mt-6 whitespace-pre-line text-muted-foreground">{evento.descricao}</p>

      {mesas.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-bold">Mesas do evento</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mesas.map((mesa) => (
              <MesaCard key={mesa.slug} mesa={mesa} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="flex items-center gap-1.5 font-heading text-xl font-bold">
          <Ticket className="size-5 text-primary" aria-hidden />
          Ingressos
        </h2>

        {!logado ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Você precisa estar logado pra comprar.{" "}
            <Link href="/entrar" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        ) : ingressoExistente ? (
          <div className="mt-4 rounded-xl border border-border bg-card/60 p-5 text-sm">
            <p className="font-medium">{STATUS_INGRESSO_LABEL[ingressoExistente.status] ?? ingressoExistente.status}</p>
            {ingressoExistente.status === "recusado" && ingressoExistente.motivo_recusa && (
              <p className="mt-1 text-muted-foreground">Motivo: {ingressoExistente.motivo_recusa}</p>
            )}
          </div>
        ) : esgotado ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            As vagas desse evento esgotaram.
          </p>
        ) : tipos.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Ainda não tem ingresso disponível pra esse evento.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {tipos.map((tipo) => (
              <div key={tipo.id} className="flex flex-col rounded-xl border border-border bg-card/60 p-5">
                <p className="font-heading font-bold">{tipo.nome}</p>
                {tipo.descricao && <p className="mt-1 text-sm text-muted-foreground">{tipo.descricao}</p>}
                <p className="mt-3 font-heading text-2xl font-bold text-primary">
                  {formatBRL(tipo.preco_centavos)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tipo.limite_mesas
                    ? `Candidatura em até ${tipo.limite_mesas} ${tipo.limite_mesas === 1 ? "mesa" : "mesas"} do evento`
                    : "Candidatura em qualquer mesa do evento"}
                </p>
                <div className="mt-4">
                  <ComprarIngressoButton
                    eventoId={evento.id}
                    tipoId={tipo.id}
                    tipoNome={tipo.nome}
                    precoCentavos={tipo.preco_centavos}
                    slug={slug}
                    chavePix={evento.chave_pix}
                    whatsappConfirmacao={evento.whatsapp_confirmacao}
                    nomeCompletoAtual={nomeCompletoAtual}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
