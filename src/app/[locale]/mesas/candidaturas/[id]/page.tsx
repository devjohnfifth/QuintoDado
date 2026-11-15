import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Pencil, ExternalLink } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { InscricaoActionsMestre } from "./inscricao-actions-mestre";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Candidaturas");
  return { title: t("metaTitulo"), robots: { index: false } };
}

/** Status da inscrição → chave de tradução. */
const STATUS_CHAVE: Record<string, string> = {
  candidatura_enviada: "statusCandidaturaEnviada",
  aguardando_pagamento: "statusAguardandoPagamento",
  pago_em_analise: "statusPagoEmAnalise",
  aprovado: "statusAprovado",
  recusado: "statusRecusado",
  expirada: "statusExpirada",
  cancelada_jogador: "statusCanceladaJogador",
  cancelada_mestre: "statusCanceladaMestre",
  reembolsada: "statusReembolsada",
  concluida: "statusConcluida",
};

const PENDENTES = ["candidatura_enviada", "aguardando_pagamento", "pago_em_analise"];

export default async function MinhasCandidaturasPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("Candidaturas");

  if (!isSupabaseConfigured()) {
    redirect({ href: "/entrar", locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("id, slug, titulo, vagas_total, mestre_id")
    .eq("id", id)
    .maybeSingle();

  // Vale pra mesa online e presencial: desde que o mestre publica mesa online,
  // travar este painel em "presencial" deixava ele sem jeito de ver quem se
  // candidatou. Quem pode ver continua sendo só o dono da mesa (ou admin).
  if (!mesa || (mesa.mestre_id !== user.id && perfil?.papel !== "admin")) {
    notFound();
  }

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select(
      "id, status, criado_em, profiles!inscricoes_usuario_id_fkey(nome_exibicao, username, avatar_url), inscricao_respostas(resposta, mesa_perguntas(enunciado, ordem))",
    )
    .eq("mesa_id", id)
    .order("criado_em", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/conta" className="hover:underline">
          {t("voltar")}
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold">{mesa.titulo}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/mesas/editar/${id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="size-3.5" aria-hidden />
            {t("editarMesa")}
          </Link>
          <Link
            href={`/mesas/${mesa.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            {t("verPaginaPublica")}
          </Link>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-lg font-bold">
        {t("titulo", { n: inscricoes?.length ?? 0 })}
      </h2>

      {!inscricoes || inscricoes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("vazio")}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {inscricoes.map((inscricao) => {
            const perfilCandidato = inscricao.profiles as unknown as {
              nome_exibicao: string;
              username: string;
              avatar_url: string | null;
            } | null;
            const respostas = (
              inscricao.inscricao_respostas as unknown as {
                resposta: string;
                mesa_perguntas: { enunciado: string; ordem: number } | null;
              }[]
            ).sort((a, b) => (a.mesa_perguntas?.ordem ?? 0) - (b.mesa_perguntas?.ordem ?? 0));

            return (
              <li
                key={inscricao.id}
                className="rounded-xl border border-border bg-card/60 p-5 transition-colors duration-200 hover:border-primary/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {perfilCandidato?.avatar_url ? (
                      <Image
                        src={perfilCandidato.avatar_url}
                        alt={perfilCandidato.nome_exibicao}
                        width={36}
                        height={36}
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-full bg-marca text-sm font-bold text-white">
                        {(perfilCandidato?.nome_exibicao ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{perfilCandidato?.nome_exibicao ?? t("jogadorSemNome")}</p>
                      <p className="text-xs text-muted-foreground">@{perfilCandidato?.username}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {STATUS_CHAVE[inscricao.status] ? t(STATUS_CHAVE[inscricao.status]) : inscricao.status}
                  </span>
                </div>

                {respostas.length > 0 && (
                  <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                    {respostas.map((r, i) => (
                      <div key={i}>
                        <dt className="text-xs text-muted-foreground">
                          {r.mesa_perguntas?.enunciado ?? t("perguntaSemEnunciado")}
                        </dt>
                        <dd className="mt-0.5">{r.resposta || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {PENDENTES.includes(inscricao.status) && (
                  <div className="mt-4">
                    <InscricaoActionsMestre inscricaoId={inscricao.id} mesaId={mesa.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
