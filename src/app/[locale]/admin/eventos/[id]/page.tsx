import { notFound } from "next/navigation";
import Image from "next/image";
import { Pencil, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { IngressoActions } from "./ingresso-actions";
import { EventoStatusActions } from "./evento-status-actions";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

const STATUS_EVENTO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export default async function AdminEventoDetalhePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, slug, titulo, status")
    .eq("id", id)
    .maybeSingle();

  if (!evento) notFound();

  const { data: ingressos } = await supabase
    .from("evento_ingressos")
    .select(
      "id, status, criado_em, usuario_id, profiles!evento_ingressos_usuario_id_fkey(nome_exibicao, nome_completo, username, avatar_url), evento_ingresso_tipos(nome, preco_centavos)",
    )
    .eq("evento_id", id)
    .order("criado_em", { ascending: true });

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/eventos" className="hover:underline">
          ← Voltar pra eventos
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold">{evento.titulo}</h1>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {STATUS_EVENTO_LABEL[evento.status] ?? evento.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/eventos/${id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="size-3.5" aria-hidden />
            Editar evento
          </Link>
          <Link
            href={`/eventos/${evento.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Ver página pública
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <EventoStatusActions eventoId={id} status={evento.status} />
      </div>

      <h2 className="mt-8 font-heading text-lg font-bold">Pedidos de ingresso ({ingressos?.length ?? 0})</h2>

      {!ingressos || ingressos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido de ingresso ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {ingressos.map((ingresso) => {
            const perfil = ingresso.profiles as unknown as {
              nome_exibicao: string;
              nome_completo: string | null;
              username: string;
              avatar_url: string | null;
            } | null;
            const tipo = ingresso.evento_ingresso_tipos as unknown as {
              nome: string;
              preco_centavos: number;
            } | null;

            return (
              <li
                key={ingresso.id}
                className="rounded-xl border border-border bg-card/60 p-5 transition-colors duration-200 hover:border-primary/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {perfil?.avatar_url ? (
                      <Image
                        src={perfil.avatar_url}
                        alt={perfil.nome_exibicao}
                        width={36}
                        height={36}
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-sm font-bold text-white">
                        {(perfil?.nome_exibicao ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">
                        {perfil?.nome_completo || perfil?.nome_exibicao || "Pessoa"}
                      </p>
                      <p className="text-xs text-muted-foreground">@{perfil?.username}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {STATUS_LABEL[ingresso.status] ?? ingresso.status}
                  </span>
                </div>

                <p className="mt-3 border-t border-border/60 pt-3 text-sm">
                  <span className="text-muted-foreground">Ingresso:</span> {tipo?.nome ?? "—"}
                  {tipo && <span className="text-muted-foreground"> · {formatBRL(tipo.preco_centavos)}</span>}
                </p>

                {ingresso.status === "pendente" && (
                  <div className="mt-4">
                    <IngressoActions ingressoId={ingresso.id} eventoId={id} />
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
