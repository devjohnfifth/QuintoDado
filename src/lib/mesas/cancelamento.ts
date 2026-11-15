/**
 * Por quanto tempo uma mesa cancelada continua aparecendo nas listas de quem
 * cuida dela (o mestre em `/conta`, o admin em `/admin/mesas`).
 *
 * Ela precisa ficar visível o bastante pro mestre ver que o cancelamento
 * pegou de verdade, e sumir depois pra não entulhar a lista com mesa que não
 * existe mais. Mesa cancelada nunca aparece em lista pública — isso é outro
 * filtro, por `status = 'publicada'`.
 *
 * A janela mora aqui, numa constante só, porque a regra é aplicada de dois
 * jeitos: no banco (`.or()` do PostgREST, quando a lista é grande) e em
 * memória (quando a página precisa distinguir "não tem mesa nenhuma" de "as
 * que tinha já sumiram"). Se um dia virar 48h, muda num lugar só.
 */
export const HORAS_MESA_CANCELADA_VISIVEL = 24;

const JANELA_MS = HORAS_MESA_CANCELADA_VISIVEL * 60 * 60 * 1000;

/** Instante-limite: cancelamento mais antigo que isso já não aparece. */
export function limiteMesaCanceladaVisivel(agora: Date = new Date()): string {
  return new Date(agora.getTime() - JANELA_MS).toISOString();
}

/**
 * Filtro pro `.or()` do PostgREST: tudo que não foi cancelado, mais o que foi
 * cancelado há pouco.
 *
 * Mesa cancelada com `cancelado_em` nulo (cancelada antes da coluna existir,
 * ou direto no banco) não bate nenhum dos dois lados e some. É o que a gente
 * quer: sem data de cancelamento, trata como antiga.
 */
export function filtroMesasSemCanceladasAntigas(agora?: Date): string {
  return `status.neq.cancelada,cancelado_em.gte.${limiteMesaCanceladaVisivel(agora)}`;
}

/**
 * A mesma regra acima, aplicada em memória — pra quando a página já tem as
 * linhas na mão.
 *
 * Compara em milissegundos, não como texto: o Postgres devolve
 * `2026-09-14T16:45:04.607+00:00` e `toISOString()` devolve `...Z`, então
 * comparar string com string daria errado em cancelamentos do mesmo segundo.
 */
export function mesaVisivelParaODono(
  mesa: { status: string; cancelado_em: string | null },
  agora: Date = new Date(),
): boolean {
  if (mesa.status !== "cancelada") return true;
  if (!mesa.cancelado_em) return false;

  const quando = Date.parse(mesa.cancelado_em);
  return Number.isFinite(quando) && quando >= agora.getTime() - JANELA_MS;
}
