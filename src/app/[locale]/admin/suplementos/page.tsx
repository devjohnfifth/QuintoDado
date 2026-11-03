import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLASSIFICACAO_LABEL } from "@/lib/mesas/labels";
import { TIPO_SUPLEMENTO, type TipoSuplemento } from "@/lib/suplementos/labels";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { ListaControles } from "../lista-controles";

const POR_PAGINA = 20;

type Filtros = { status?: string; q?: string; pagina?: string };

export default async function AdminSuplementosPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: suplementos, error } = await supabase
    .from("suplementos")
    .select("id, slug, titulo, tipo, classificacao, publicado, downloads_count, sistemas(nome)")
    .order("criado_em", { ascending: false });

  if (error) console.error("[/admin/suplementos] erro ao buscar:", error.message);

  const todos = suplementos ?? [];
  // Suplemento não tem enum de status, só o booleano `publicado`.
  const nPublicados = todos.filter((s) => s.publicado).length;
  const opcoes = [
    { valor: "publicado", rotulo: "Publicado", n: nPublicados },
    { valor: "rascunho", rotulo: "Rascunho", n: todos.length - nPublicados },
  ];

  const termo = sp.q?.trim().toLowerCase() ?? "";
  const filtrados = todos.filter(
    (s) =>
      (!sp.status || (sp.status === "publicado" ? s.publicado : !s.publicado)) &&
      (!termo || s.titulo.toLowerCase().includes(termo)),
  );
  const { pagina, totalPaginas, fatia } = fatiar(filtrados, sp.pagina, POR_PAGINA);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-display titulo-secao">Suplementos</h1>
        <Link
          href="/admin/suplementos/novo"
          className="rounded-full bg-marca px-4 py-2 text-sm font-medium text-white"
        >
          + Novo suplemento
        </Link>
      </div>

      <ListaControles
        caminho="/admin/suplementos"
        statusAtual={sp.status}
        opcoes={opcoes}
        busca={sp.q}
        placeholder="Buscar pelo título..."
        total={todos.length}
      />

      {fatia.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {todos.length === 0
            ? "Nenhum suplemento ainda. Crie o primeiro — a especificação sugere ter 5 ou 6 publicados antes de divulgar."
            : "Nenhum suplemento com esse filtro."}
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
              {fatia.map((s) => {
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
                            ? "border-sucesso/40 text-sucesso"
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

      <Paginacao
        caminho="/admin/suplementos"
        pagina={pagina}
        totalPaginas={totalPaginas}
        filtros={{ status: sp.status, q: sp.q }}
      />
    </div>
  );
}
