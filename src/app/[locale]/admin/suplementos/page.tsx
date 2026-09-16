import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLASSIFICACAO_LABEL } from "@/lib/mesas/labels";
import { TIPO_SUPLEMENTO, type TipoSuplemento } from "@/lib/suplementos/labels";

export default async function AdminSuplementosPage() {
  const supabase = await createClient();
  const { data: suplementos, error } = await supabase
    .from("suplementos")
    .select("id, slug, titulo, tipo, classificacao, publicado, downloads_count, sistemas(nome)")
    .order("criado_em", { ascending: false });

  if (error) console.error("[/admin/suplementos] erro ao buscar:", error.message);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Suplementos</h1>
        <Link
          href="/admin/suplementos/novo"
          className="rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white"
        >
          + Novo suplemento
        </Link>
      </div>

      {!suplementos || suplementos.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum suplemento ainda. Crie o primeiro — a especificação sugere ter 5 ou 6 publicados antes de divulgar.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Sistema</th>
                <th className="py-2 pr-4">Faixa</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {suplementos.map((s) => {
                const sistema = (s.sistemas as unknown as { nome: string } | null)?.nome;
                return (
                  <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-accent/40">
                    <td className="py-3 pr-4 font-medium">
                      <Link href={`/admin/suplementos/${s.id}/editar`} className="hover:underline">
                        {s.titulo}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {TIPO_SUPLEMENTO[s.tipo as TipoSuplemento]?.rotulo ?? s.tipo}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{sistema ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {CLASSIFICACAO_LABEL[s.classificacao] ?? s.classificacao}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          s.publicado
                            ? "border-emerald-500/40 text-emerald-400"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {s.publicado ? "Publicado" : "Rascunho"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">{s.downloads_count}</td>
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
