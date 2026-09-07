import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { InscricaoActions } from "./inscricao-actions";

const STATUS_LABEL: Record<string, string> = {
  candidatura_enviada: "Candidatura enviada",
  aguardando_pagamento: "Aguardando pagamento",
  pago_em_analise: "Pagamento em análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirada: "Expirada",
  cancelada_jogador: "Cancelada pelo jogador",
  cancelada_mestre: "Cancelada pelo mestre",
  reembolsada: "Reembolsada",
  concluida: "Concluída",
};

const PENDENTES = ["candidatura_enviada", "aguardando_pagamento", "pago_em_analise"];

export default async function AdminMesaDetalhePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mesa } = await supabase
    .from("mesas")
    .select("id, slug, titulo, vagas_total, status")
    .eq("id", id)
    .maybeSingle();

  if (!mesa) notFound();

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select(
      "id, status, criado_em, profiles!inscricoes_usuario_id_fkey(nome_exibicao, username), inscricao_respostas(resposta, mesa_perguntas(enunciado, ordem))",
    )
    .eq("mesa_id", id)
    .order("criado_em", { ascending: true });

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/mesas" className="hover:underline">
          ← Voltar pra mesas
        </Link>
      </p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{mesa.titulo}</h1>
        <Link href={`/mesas/${mesa.slug}`} className="text-sm text-primary hover:underline">
          Ver página pública →
        </Link>
      </div>

      <h2 className="mt-8 font-heading text-lg font-bold">
        Candidaturas ({inscricoes?.length ?? 0})
      </h2>

      {!inscricoes || inscricoes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma candidatura ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {inscricoes.map((inscricao) => {
            const perfil = inscricao.profiles as unknown as {
              nome_exibicao: string;
              username: string;
            } | null;
            const respostas = (
              inscricao.inscricao_respostas as unknown as {
                resposta: string;
                mesa_perguntas: { enunciado: string; ordem: number } | null;
              }[]
            ).sort((a, b) => (a.mesa_perguntas?.ordem ?? 0) - (b.mesa_perguntas?.ordem ?? 0));

            return (
              <li key={inscricao.id} className="rounded-xl border border-border bg-card/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{perfil?.nome_exibicao ?? "Jogador"}</p>
                    <p className="text-xs text-muted-foreground">@{perfil?.username}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {STATUS_LABEL[inscricao.status] ?? inscricao.status}
                  </span>
                </div>

                {respostas.length > 0 && (
                  <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                    {respostas.map((r, i) => (
                      <div key={i}>
                        <dt className="text-xs text-muted-foreground">
                          {r.mesa_perguntas?.enunciado ?? "Pergunta"}
                        </dt>
                        <dd className="mt-0.5">{r.resposta || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {PENDENTES.includes(inscricao.status) && (
                  <div className="mt-4">
                    <InscricaoActions inscricaoId={inscricao.id} mesaId={mesa.id} />
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
