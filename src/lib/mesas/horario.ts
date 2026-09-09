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
