/**
 * As duas perguntas fixas de toda mesa (§11.3 do documento de projeto).
 * Linhas e véus não é obrigatória (o jogador pode não ter nada a vetar);
 * experiência vira uma escolha fechada — mais fácil de responder e mais
 * fácil de comparar entre candidaturas.
 */
export function perguntasFixas(mesaId: string) {
  return [
    {
      mesa_id: mesaId,
      enunciado: "Linhas e véus: o que não pode aparecer nessa mesa?",
      tipo: "texto_longo",
      obrigatoria: false,
      fixa: true,
      ordem: 0,
    },
    {
      mesa_id: mesaId,
      enunciado: "Qual sua experiência com o sistema?",
      tipo: "escolha_unica",
      opcoes: ["Nenhuma", "Pouca", "Mediana", "Muita"],
      obrigatoria: true,
      fixa: true,
      ordem: 1,
    },
  ];
}
