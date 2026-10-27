import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Monta a janela de páginas com reticências: sempre a primeira, a última, a
 * atual e as vizinhas. Com poucas páginas mostra todas.
 */
function janela(atual: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set<number>([1, total, atual, atual - 1, atual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const saida: (number | "...")[] = [];
  let anterior = 0;
  for (const p of ordenadas) {
    if (anterior && p - anterior > 1) saida.push("...");
    saida.push(p);
    anterior = p;
  }
  return saida;
}

const CLASSE_BOTAO =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-border px-3 text-sm font-medium transition-colors";

/**
 * Paginação de listagem.
 *
 * Preserva os filtros que já estão na URL (então paginar não zera o que a
 * pessoa escolheu) e é feita de links de verdade — funciona sem JS, o robô de
 * busca consegue rastrear as outras páginas e o botão de voltar do navegador
 * faz o que se espera.
 */
export function Paginacao({
  caminho,
  pagina,
  totalPaginas,
  filtros = {},
}: {
  /** Rota da listagem, ex.: "/mesas". */
  caminho: string;
  pagina: number;
  totalPaginas: number;
  /** Filtros atuais da URL, repassados em cada link. */
  filtros?: Record<string, string | undefined>;
}) {
  const t = useTranslations("Paginacao");
  if (totalPaginas <= 1) return null;

  const limpos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)) as Record<string, string>;
  // A página 1 não leva `pagina=1` na URL: mantém o endereço canônico limpo.
  const href = (p: number) => ({
    pathname: caminho,
    query: p === 1 ? limpos : { ...limpos, pagina: String(p) },
  });

  return (
    <nav aria-label={t("rotulo")} className="mt-10 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {pagina > 1 ? (
            <Link href={href(pagina - 1)} rel="prev" className={`${CLASSE_BOTAO} hover:border-primary/40 hover:bg-primary/10`}>
              <ChevronLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t("anterior")}</span>
            </Link>
          ) : (
            <span aria-disabled className={`${CLASSE_BOTAO} opacity-35`}>
              <ChevronLeft className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t("anterior")}</span>
            </span>
          )}
        </li>

        {janela(pagina, totalPaginas).map((p, i) =>
          p === "..." ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              {p === pagina ? (
                <span aria-current="page" className={`${CLASSE_BOTAO} border-acento/60 bg-acento/15 text-acento`}>
                  {p}
                </span>
              ) : (
                <Link
                  href={href(p)}
                  aria-label={t("irPara", { n: p })}
                  className={`${CLASSE_BOTAO} text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground`}
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {pagina < totalPaginas ? (
            <Link href={href(pagina + 1)} rel="next" className={`${CLASSE_BOTAO} hover:border-primary/40 hover:bg-primary/10`}>
              <span className="hidden sm:inline">{t("proxima")}</span>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span aria-disabled className={`${CLASSE_BOTAO} opacity-35`}>
              <span className="hidden sm:inline">{t("proxima")}</span>
              <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </li>
      </ul>

      <p className="text-xs text-muted-foreground">{t("de", { atual: pagina, total: totalPaginas })}</p>
    </nav>
  );
}

/**
 * Lê `?pagina=` da URL e devolve a fatia pedida, já com o total de páginas.
 * Serve pras listas que precisam do conjunto inteiro em memória (porque os
 * filtros são montados a partir dele) — quando o acervo crescer, troca por
 * `.range()` na consulta sem mexer no componente acima.
 */
export function fatiar<T>(itens: T[], paginaBruta: string | undefined, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const pedida = Number.parseInt(paginaBruta ?? "1", 10);
  const pagina = Number.isFinite(pedida) ? Math.min(Math.max(pedida, 1), totalPaginas) : 1;
  const inicio = (pagina - 1) * porPagina;
  return { pagina, totalPaginas, fatia: itens.slice(inicio, inicio + porPagina), total: itens.length };
}

/** Mesma conta, mas pra quem pagina no banco: devolve o intervalo do `.range()`. */
export function intervalo(paginaBruta: string | undefined, porPagina: number) {
  const pedida = Number.parseInt(paginaBruta ?? "1", 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;
  const inicio = (pagina - 1) * porPagina;
  return { pagina, inicio, fim: inicio + porPagina - 1 };
}
