import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { ComprarIngressoButton } from "./comprar-ingresso-button";
import { GaleriaLightbox } from "./galeria-lightbox";
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
      "id, titulo, subtitulo, descricao, banner_url, cidade_uf, local, data_inicio, data_fim, horario_inicio, horario_fim, chave_pix, whatsapp_confirmacao, capacidade_maxima, ingressos_vendidos, vendas_abertas",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) return null;

  const [{ data: tipos }, { data: mesas }, { data: imagens }, { data: apoiadores }, { data: atracoes }, { data: mestresData }] =
    await Promise.all([
      supabase
        .from("evento_ingresso_tipos")
        .select("id, nome, descricao, preco_centavos, limite_mesas")
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
  const { slug } = await params;
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

  const dataFormatada = new Date(`${evento.data_inicio}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const esgotado = Boolean(
    evento.capacidade_maxima && evento.ingressos_vendidos >= evento.capacidade_maxima,
  );

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
      {evento.banner_url && (
        <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={evento.banner_url}
            alt={evento.titulo}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1024px, (min-width: 672px) 672px, 100vw"
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

      <p className="mt-6 max-w-2xl whitespace-pre-line text-muted-foreground">{evento.descricao}</p>

      {(atracoes.length > 0 || mestres.length > 0) && (
        <div
          className={`mt-10 gap-8 ${
            atracoes.length > 0 && mestres.length > 0 ? "grid sm:grid-cols-3" : ""
          }`}
        >
          {atracoes.length > 0 && (
            <div className={mestres.length > 0 ? "sm:col-span-2" : ""}>
              <h2 className="font-heading text-xl font-bold">Programação</h2>
              <ul className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
                {atracoes.map((a, i) => (
                  <li key={i}>
                    {a.horario && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Clock className="size-3.5 shrink-0" aria-hidden />
                        {a.horario}
                      </p>
                    )}
                    <p className="font-medium">{a.titulo}</p>
                    {a.descricao && <p className="text-sm text-muted-foreground">{a.descricao}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mestres.length > 0 && (
            <div className={atracoes.length > 0 ? "sm:col-span-1" : ""}>
              <h2 className="font-heading text-xl font-bold">Mestres confirmados</h2>
              <div className="mt-4 grid gap-3">
                {mestres.map((m) => (
                  <div
                    key={m.username}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4"
                  >
                    {m.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt={m.nome_exibicao}
                        width={44}
                        height={44}
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-sm font-bold text-white">
                        {m.nome_exibicao.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{m.nome_exibicao}</p>
                      {m.bio ? (
                        <p className="truncate text-xs text-muted-foreground">{m.bio}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">@{m.username}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mesas.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-bold">Mesas do evento</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {evento.vendas_abertas ? (
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
                  ) : (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                      Vendas indisponíveis no momento.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {imagens.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-bold">Galeria</h2>
          <GaleriaLightbox imagens={imagens} />
        </div>
      )}

      {apoiadores.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-bold">Apoiadores</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
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
              return a.link ? (
                <a
                  key={i}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.nome}
                  className="transition-opacity hover:opacity-80"
                >
                  {logo}
                </a>
              ) : (
                <span key={i} title={a.nome}>
                  {logo}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
