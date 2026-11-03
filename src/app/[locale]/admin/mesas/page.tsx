import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { MODALIDADE_LABEL, TIPO_MESA_LABEL } from "@/lib/mesas/labels";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { ListaControles } from "../lista-controles";
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

/** Ordem dos chips: o que exige ação primeiro, o arquivo morto por último. */
const ORDEM_STATUS = [
  "aguardando_aprovacao",
  "publicada",
  "confirmada",
  "em_andamento",
  "rascunho",
  "concluida",
  "cancelada",
];

const POR_PAGINA = 20;

type Filtros = { status?: string; q?: string; pagina?: string };

export default async function AdminMesasPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: mesas, error } = await supabase
    .from("mesas")
    .select("id, slug, titulo, status, modalidade, cidade_uf, tipo, data_inicio, sistemas(nome), sistema_outro")
    .or(`status.neq.cancelada,cancelado_em.gte.${umDiaAtras}`)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[/admin/mesas] erro ao buscar mesas:", error.message);
  }

  const todas = mesas ?? [];
  // Contagem por status sai do conjunto inteiro: os chips mostram quanta
  // mesa existe em cada estado mesmo enquanto você olha um só.
  const contagem = todas.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});
  const opcoes = ORDEM_STATUS.filter((s) => contagem[s] !== undefined).map((s) => ({
    valor: s,
    rotulo: STATUS_LABEL[s] ?? s,
    n: contagem[s] ?? 0,
  }));

  const termo = sp.q?.trim().toLowerCase() ?? "";
  const filtradas = todas.filter(
    (m) => (!sp.status || m.status === sp.status) && (!termo || m.titulo.toLowerCase().includes(termo)),
  );
  const { pagina, totalPaginas, fatia } = fatiar(filtradas, sp.pagina, POR_PAGINA);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo-display titulo-secao">Mesas</h1>
        <Link href="/admin/mesas/nova" className="rounded-full bg-marca px-4 py-2 text-sm font-medium text-white">
          + Nova mesa
        </Link>
      </div>

      <ListaControles
        caminho="/admin/mesas"
        statusAtual={sp.status}
        opcoes={opcoes}
        busca={sp.q}
        placeholder="Buscar pelo título..."
        total={todas.length}
      />

      {fatia.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {todas.length === 0
            ? "Nenhuma mesa ainda. Crie a primeira ou aguarde uma mesa presencial enviada por um mestre."
            : "Nenhuma mesa com esse filtro."}
        </p>
      ) : (
        <>
          {/*
           * Tabela no desktop, cartões no celular. A tabela tinha
           * `min-w-[640px]`, então no telefone virava rolagem lateral — e
           * aprovar mesa pelo celular é caso real.
           */}
          <ul className="mt-6 space-y-3 md:hidden">
            {fatia.map((mesa) => (
              <li
                key={mesa.id}
                className={`rounded-xl painel p-4 ${mesa.status === "aguardando_aprovacao" ? "ring-1 ring-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/mesas/${mesa.slug}`} className="font-medium hover:underline">
                    {mesa.titulo}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                      mesa.status === "aguardando_aprovacao" ? "border-primary/40 text-primary" : "border-border"
                    }`}
                  >
                    {STATUS_LABEL[mesa.status] ?? mesa.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mesa.sistema_outro || (mesa.sistemas as unknown as { nome: string } | null)?.nome || "—"}
                  {" · "}
                  {MODALIDADE_LABEL[mesa.modalidade]}
                  {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` (${mesa.cidade_uf})` : ""}
                </p>
                <div className="mt-3 flex items-center justify-end gap-3">
                  <Link
                    href={`/admin/mesas/${mesa.id}/editar`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Editar
                  </Link>
                  <MesaRowActions mesaId={mesa.id} status={mesa.status} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden md:block">
            <table className="w-full text-left text-sm">
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
                {fatia.map((mesa) => (
                  <tr
                    key={mesa.id}
                    className={`border-b border-border/60 transition-colors duration-200 hover:bg-accent/40 ${
                      mesa.status === "aguardando_aprovacao" ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 font-medium">
                      <Link href={`/mesas/${mesa.slug}`} className="hover:underline">
                        {mesa.titulo}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {mesa.sistema_outro || (mesa.sistemas as unknown as { nome: string } | null)?.nome || "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {MODALIDADE_LABEL[mesa.modalidade]}
                      {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` (${mesa.cidade_uf})` : ""}
                      {" · "}
                      {TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          mesa.status === "aguardando_aprovacao" ? "border-primary/40 text-primary" : "border-border"
                        }`}
                      >
                        {STATUS_LABEL[mesa.status] ?? mesa.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/mesas/${mesa.id}/editar`}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Editar
                        </Link>
                        <MesaRowActions mesaId={mesa.id} status={mesa.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            caminho="/admin/mesas"
            pagina={pagina}
            totalPaginas={totalPaginas}
            filtros={{ status: sp.status, q: sp.q }}
          />
        </>
      )}
    </div>
  );
}
