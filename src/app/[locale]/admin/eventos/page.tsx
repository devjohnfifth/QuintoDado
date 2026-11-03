import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { ListaControles } from "../lista-controles";
import { VendasToggleCompacto } from "./vendas-toggle-compacto";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

/** Ação primeiro, arquivo depois. */
const ORDEM_STATUS = ["publicado", "rascunho", "encerrado", "cancelado"];

const POR_PAGINA = 20;

type Filtros = { status?: string; q?: string; pagina?: string };

export default async function AdminEventosPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: eventos, error }, { data: pendentes }] = await Promise.all([
    supabase
      .from("eventos")
      .select("id, slug, titulo, status, cidade_uf, data_inicio, vendas_abertas")
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

  const todos = eventos ?? [];
  const contagem = todos.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const opcoes = ORDEM_STATUS.filter((st) => contagem[st] !== undefined).map((st) => ({
    valor: st,
    rotulo: STATUS_LABEL[st] ?? st,
    n: contagem[st] ?? 0,
  }));

  const termo = sp.q?.trim().toLowerCase() ?? "";
  const filtrados = todos.filter(
    (e) => (!sp.status || e.status === sp.status) && (!termo || e.titulo.toLowerCase().includes(termo)),
  );
  const { pagina, totalPaginas, fatia } = fatiar(filtrados, sp.pagina, POR_PAGINA);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="titulo-display titulo-secao">Eventos</h1>
        <Link
          href="/admin/eventos/nova"
          className="rounded-full bg-marca px-4 py-2 text-sm font-medium text-white"
        >
          + Novo evento
        </Link>
      </div>

      <ListaControles
        caminho="/admin/eventos"
        statusAtual={sp.status}
        opcoes={opcoes}
        busca={sp.q}
        placeholder="Buscar pelo título..."
        total={todos.length}
      />

      {fatia.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {todos.length === 0 ? "Nenhum evento ainda. Crie o primeiro." : "Nenhum evento com esse filtro."}
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
                <th className="py-2 pr-4">Vendas</th>
                <th className="py-2 pr-4" />
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {fatia.map((evento) => {
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
                            ? "border-sucesso/40 text-sucesso"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABEL[evento.status] ?? evento.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {evento.status === "publicado" ? (
                        <VendasToggleCompacto eventoId={evento.id} vendasAbertas={evento.vendas_abertas} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/mesas/nova?eventoId=${evento.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          + Mesa
                        </Link>
                        <Link
                          href={`/admin/eventos/${evento.id}/editar`}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao
        caminho="/admin/eventos"
        pagina={pagina}
        totalPaginas={totalPaginas}
        filtros={{ status: sp.status, q: sp.q }}
      />
    </div>
  );
}
