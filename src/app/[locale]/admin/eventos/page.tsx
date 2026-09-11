import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export default async function AdminEventosPage() {
  const supabase = await createClient();
  const [{ data: eventos, error }, { data: pendentes }] = await Promise.all([
    supabase
      .from("eventos")
      .select("id, slug, titulo, status, cidade_uf, data_inicio")
      .order("criado_em", { ascending: false }),
    supabase.from("evento_ingressos").select("evento_id").eq("status", "pendente"),
  ]);

  if (error) {
    console.error("[/admin/eventos] erro ao buscar eventos:", error.message);
  }

  const pendentesPorEvento = new Map<string, number>();
  for (const p of pendentes ?? []) {
    pendentesPorEvento.set(p.evento_id, (pendentesPorEvento.get(p.evento_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Eventos</h1>
        <Link
          href="/admin/eventos/nova"
          className="rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white"
        >
          + Novo evento
        </Link>
      </div>

      {!eventos || eventos.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum evento ainda. Crie o primeiro.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Cidade</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => {
                const pendentesDoEvento = pendentesPorEvento.get(evento.id) ?? 0;
                return (
                  <tr
                    key={evento.id}
                    className={`border-b border-border/60 transition-colors duration-200 hover:bg-accent/40 ${
                      pendentesDoEvento > 0 ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 font-medium">
                      <Link href={`/admin/eventos/${evento.id}`} className="hover:underline">
                        {evento.titulo}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{evento.cidade_uf}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(`${evento.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          evento.status === "publicado"
                            ? "border-emerald-500/40 text-emerald-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABEL[evento.status] ?? evento.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/eventos/${evento.id}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium hover:underline ${
                          pendentesDoEvento > 0
                            ? "border-primary/40 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        Pedidos de ingresso{pendentesDoEvento > 0 ? ` (${pendentesDoEvento})` : ""}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Link
                        href={`/admin/eventos/${evento.id}/editar`}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
