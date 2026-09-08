export const TIPO_MESA_LABEL: Record<string, string> = {
  one_shot: "One-shot",
  aventura: "Aventura fechada",
  campanha: "Campanha",
};

export const MODALIDADE_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
};

export const CLASSIFICACAO_LABEL: Record<string, string> = {
  livre: "Livre",
  "14": "+14 anos",
  "16": "+16 anos",
  "18": "+18 anos",
};

const LIMITE_IDADE_CLASSIFICACAO: Record<string, number> = {
  livre: 0,
  "14": 14,
  "16": 16,
  "18": 18,
};

export function limiteIdadeClassificacao(classificacao: string): number {
  return LIMITE_IDADE_CLASSIFICACAO[classificacao] ?? 0;
}

export const NIVEL_LABEL: Record<string, string> = {
  todos: "Todos os níveis",
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const FREQUENCIA_LABEL: Record<string, string> = {
  unica: "Sessão única",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};
