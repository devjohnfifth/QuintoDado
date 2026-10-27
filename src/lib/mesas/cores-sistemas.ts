/**
 * Um matiz por sistema de RPG.
 *
 * O site inteiro vivia na mesma faixa de azul e roxo, então uma lista de
 * mesas de sistemas diferentes parecia a mesma mesa repetida. Aqui cada
 * sistema carrega a cor que a própria marca dele evoca — é variedade de cor
 * de graça, sem pedir arte nova, e ainda ajuda a bater o olho e reconhecer.
 *
 * As cores são usadas em `color-mix`, nunca puras sobre o fundo escuro, pra
 * não brigar com o texto.
 */
export const COR_SISTEMA: Record<string, string> = {
  "ordem-paranormal-2": "#e0384a",
  "tormenta-20": "#e0a92b",
  vaesen: "#4f9d8c",
  daggerheart: "#b06ad6",
  "fabula-ultima": "#e05297",
  "sacramento-rpg": "#d2691e",
  "vampiro-a-mascara": "#c0392b",
  "pathfinder-2e": "#c08a3e",
  "dnd-2024": "#d4403a",
  "chamado-de-cthulhu": "#6b9e4f",
};

/** Cor do sistema, ou o azul da marca quando o sistema não tem uma. */
export function corDoSistema(slug: string | null | undefined): string {
  return (slug && COR_SISTEMA[slug]) || "var(--qd-primaria)";
}
