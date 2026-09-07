import { FREQUENCIA_LABEL } from "./labels";

const DIA_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

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
