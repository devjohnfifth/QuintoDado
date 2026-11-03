import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type OpcaoStatus = { valor: string; rotulo: string; n: number };

/**
 * Controles das listas do admin: busca e filtro por status.
 *
 * As três listas (mesas, eventos, suplementos) jogavam tudo numa tabela só —
 * rascunho, publicado, aguardando aprovação e concluído misturados —, então
 * achar o que precisa de ação era varrer a tabela com o olho.
 *
 * Tudo vive na URL: a busca é um `<form method="get">` e os status são links.
 * Funciona sem JS, o endereço filtrado dá pra guardar, e a paginação anda
 * junto porque já repassa a query.
 */
export function ListaControles({
  caminho,
  statusAtual,
  opcoes,
  busca,
  placeholder,
  total,
}: {
  caminho: string;
  statusAtual: string | undefined;
  opcoes: OpcaoStatus[];
  busca: string | undefined;
  placeholder: string;
  /** Quantos itens no total, pro chip "Todos". */
  total: number;
}) {
  const chip = (ativo: boolean, vazio: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
      ativo
        ? "border-primary/60 bg-primary/15 text-primary"
        : `border-border painel hover:border-primary/40 hover:text-foreground ${
            vazio ? "text-muted-foreground/60" : "text-muted-foreground"
          }`
    }`;

  // A busca é preservada ao trocar de status, e vice-versa.
  const href = (valor?: string) => ({
    pathname: caminho,
    query: { ...(busca ? { q: busca } : {}), ...(valor ? { status: valor } : {}) },
  });

  return (
    <div className="mt-6 space-y-4">
      <form method="get" action={caminho} className="flex max-w-sm gap-2">
        {statusAtual && <input type="hidden" name="status" value={statusAtual} />}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={busca ?? ""}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 w-full rounded-full border border-border bg-transparent pl-9 pr-4 text-sm"
          />
        </div>
        <button type="submit" className="rounded-full border border-border px-4 text-sm hover:border-primary/40">
          Buscar
        </button>
      </form>

      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
        <Link href={href()} aria-current={!statusAtual ? "page" : undefined} className={chip(!statusAtual, false)}>
          Todos
          <span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums">{total}</span>
        </Link>
        {opcoes.map((o) => {
          const ativo = statusAtual === o.valor;
          return (
            <Link
              key={o.valor}
              href={href(o.valor)}
              aria-current={ativo ? "page" : undefined}
              className={chip(ativo, o.n === 0)}
            >
              {o.rotulo}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${ativo ? "bg-primary/25" : "bg-foreground/10"}`}>
                {o.n}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
