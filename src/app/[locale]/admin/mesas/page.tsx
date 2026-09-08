import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { MODALIDADE_LABEL, TIPO_MESA_LABEL } from "@/lib/mesas/labels";
import { MesaRowActions } from "./mesa-row-actions";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  publicada: "Publicada",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export default async function AdminMesasPage() {
  const supabase = await createClient();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: mesas, error } = await supabase
    .from("mesas")
    .select("id, slug, titulo, status, modalidade, cidade_uf, tipo, data_inicio, sistemas(nome)")
    .or(`status.neq.cancelada,cancelado_em.gte.${umDiaAtras}`)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[/admin/mesas] erro ao buscar mesas:", error.message);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Mesas</h1>
        <Link
          href="/admin/mesas/nova"
          className="rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white"
        >
          + Nova mesa
        </Link>
      </div>

      {!mesas || mesas.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma mesa ainda. Crie a primeira ou aguarde uma mesa presencial
          enviada por um mestre.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Sistema</th>
                <th className="py-2 pr-4">Modalidade</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">
                    <Link href={`/mesas/${mesa.slug}`} className="hover:underline">
                      {mesa.titulo}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {(mesa.sistemas as unknown as { nome: string } | null)?.nome ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {MODALIDADE_LABEL[mesa.modalidade]}
                    {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` (${mesa.cidade_uf})` : ""}
                    {" · "}
                    {TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                      {STATUS_LABEL[mesa.status] ?? mesa.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <MesaRowActions mesaId={mesa.id} status={mesa.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
