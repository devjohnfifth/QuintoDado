/**
 * As iniciais que entram no lugar do avatar quando a pessoa não subiu foto.
 *
 * Existe porque isto estava copiado em quatro lugares e com duas regras
 * diferentes: o cabeçalho e a conta pegavam duas letras ("MT"), enquanto o
 * formulário de editar perfil e os cards de mesa pegavam só a primeira ("M").
 * A mesma pessoa mudava de cara ao clicar em "Editar perfil".
 *
 * Duas letras, porque é o que distingue dois "Marina" numa lista de
 * jogadores — que é justamente onde o avatar sem foto aparece em série.
 */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return partes
    .slice(0, 2)
    .map((p) => [...p][0]?.toUpperCase() ?? "")
    .join("");
}
