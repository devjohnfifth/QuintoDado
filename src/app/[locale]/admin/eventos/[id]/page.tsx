import { notFound } from "next/navigation";
import Image from "next/image";
import { Pencil, ExternalLink, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { STATUS_INGRESSO_LABEL } from "@/lib/eventos/labels";
import { IngressoActions } from "./ingresso-actions";
import { EventoStatusActions } from "./evento-status-actions";
import { VendasToggle } from "./vendas-toggle";
import { ExportarIngressos } from "./exportar-ingressos";
import { Paginacao, intervalo } from "@/components/site/paginacao";

const STATUS_EVENTO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

const STATUS_MESA_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  publicada: "Publicada",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Quantos pedidos de ingresso por página. */
const POR_PAGINA = 25;

export default async function AdminEventoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, slug, titulo, status, vendas_abertas")
    .eq("id", id)
    .maybeSingle();

  if (!evento) notFound();

  // A lista de pedidos é a que cresce de verdade aqui (um evento já passou de
  // trinta), então ela pagina no banco. O botão de exportar continua puxando
  // tudo — ver exportarIngressosAction.
  const { pagina, inicio, fim } = intervalo(sp.pagina, POR_PAGINA);

  const [{ data: ingressos, count: totalIngressos }, { data: mesas }] = await Promise.all([
    supabase
      .from("evento_ingressos")
      .select(
        "id, status, criado_em, usuario_id, profiles!evento_ingressos_usuario_id_fkey(nome_exibicao, nome_completo, username, avatar_url, telefone), evento_ingresso_tipos(nome, preco_centavos)",
        { count: "exact" },
      )
      .eq("evento_id", id)
      .order("criado_em", { ascending: true })
      .range(inicio, fim),
    supabase
      .from("mesas")
      .select("id, titulo, status")
      .eq("evento_id", id)
      .order("criado_em", { ascending: true }),
  ]);

  const total = totalIngressos ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

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

      {evento.status === "publicado" && (
        <div className="mt-4">
          <VendasToggle eventoId={id} vendasAbertas={evento.vendas_abertas} />
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Mesas do evento ({mesas?.length ?? 0})</h2>
        <Link
          href={`/admin/mesas/nova?eventoId=${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="size-4" aria-hidden />
          Adicionar mesa
        </Link>
      </div>

      {!mesas || mesas.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma mesa vinculada a esse evento ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {mesas.map((mesa) => (
            <li
              key={mesa.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-4 text-sm transition-colors duration-200 hover:border-primary/30"
            >
              <Link href={`/admin/mesas/${mesa.id}`} className="font-medium hover:underline">
                {mesa.titulo}
              </Link>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {STATUS_MESA_LABEL[mesa.status] ?? mesa.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        {/* O número é o total do evento, não o da página aberta. */}
        <h2 className="font-heading text-lg font-bold">Pedidos de ingresso ({total})</h2>
        {ingressos && ingressos.length > 0 && <ExportarIngressos eventoId={id} />}
      </div>

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
              telefone: string | null;
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
                      <span className="flex size-9 items-center justify-center rounded-full bg-marca text-sm font-bold text-white">
                        {(perfil?.nome_exibicao ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{perfil?.nome_completo || perfil?.nome_exibicao || "Pessoa"}</p>
                      <p className="text-xs text-muted-foreground">
                        {/* Quando há nome completo, o de exibição ainda importa: é como a pessoa aparece no site. */}
                        {perfil?.nome_completo && perfil.nome_exibicao !== perfil.nome_completo
                          ? `${perfil.nome_exibicao} · @${perfil?.username}`
                          : `@${perfil?.username}`}
                      </p>
                      {perfil?.telefone && (
                        <p className="text-xs text-muted-foreground">
                          <a href={`tel:${perfil.telefone}`} className="hover:text-foreground hover:underline">
                            {perfil.telefone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {STATUS_INGRESSO_LABEL[ingresso.status] ?? ingresso.status}
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

      <Paginacao caminho={`/admin/eventos/${id}`} pagina={pagina} totalPaginas={totalPaginas} />
    </div>
  );
}
