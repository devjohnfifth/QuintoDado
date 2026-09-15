import { FREQUENCIA_LABEL } from "./labels";

/**
 * "Hoje" no fuso de Brasília, em YYYY-MM-DD. O servidor (Vercel) roda em
 * UTC — usar `new Date()` puro pra decidir "hoje" vira amanhã 3h mais
 * cedo do que devia (21h de Brasília já é meia-noite UTC).
 */
export function hojeNoBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const DIA_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DIA_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** "Sex" — abreviação do dia da semana da data de início. */
export function diaSemanaAbreviado(dataInicio: string) {
  return DIA_SEMANA_ABREV[new Date(`${dataInicio}T00:00:00`).getDay()];
}

/** Dias completos até `dataInicio` (0 = hoje, negativo = já passou). */
export function diasParaComeco(dataInicio: string) {
  const hoje = new Date(`${hojeNoBrasil()}T00:00:00`);
  const inicio = new Date(`${dataInicio}T00:00:00`);
  return Math.round((inicio.getTime() - hoje.getTime()) / 86_400_000);
}

const DIAS_ENTRE_SESSOES: Record<string, number> = {
  semanal: 7,
  quinzenal: 14,
  mensal: 30,
};

/**
 * Data prevista da última sessão, em YYYY-MM-DD.
 *
 * One-shot acaba no próprio dia. Aventura fechada tem nº de sessões definido,
 * então dá pra estimar o fim. Campanha é aberta por definição — devolve
 * `null`, e quem chama decide como mostrar isso.
 *
 * É estimativa: sessão remarcada ou pulada muda o fim real.
 */
export function dataFimPrevista(mesa: {
  tipo: string;
  frequencia: string;
  qtd_sessoes: number | null;
  data_inicio: string;
}): string | null {
  if (mesa.tipo === "one_shot" || mesa.frequencia === "unica") return mesa.data_inicio;
  if (mesa.tipo !== "aventura" || !mesa.qtd_sessoes || mesa.qtd_sessoes < 2) return null;

  const intervalo = DIAS_ENTRE_SESSOES[mesa.frequencia];
  if (!intervalo) return null;

  const fim = new Date(`${mesa.data_inicio}T00:00:00`);
  fim.setDate(fim.getDate() + (mesa.qtd_sessoes - 1) * intervalo);
  return new Intl.DateTimeFormat("en-CA").format(fim);
}

/** "Semanal · domingo às 18:30" — mesmo padrão do Tavernaria/MesaQuest. */
export function formatarFrequenciaEHorario(
  dataInicio: string,
  horarioInicio: string,
  frequencia: string,
) {
  const dia = DIA_SEMANA[new Date(`${dataInicio}T00:00:00`).getDay()];
  const horario = horarioInicio.slice(0, 5);
  const freq = FREQUENCIA_LABEL[frequencia] ?? frequencia;
  return `${freq} · ${dia} às ${horario}`;
}
