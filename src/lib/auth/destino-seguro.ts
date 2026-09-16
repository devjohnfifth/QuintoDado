/**
 * Valida o `?next=` do login. Só aceita caminho interno (começa com "/" e não
 * com "//" nem "/\"), senão vira open redirect pra qualquer domínio.
 */
export function destinoSeguro(valor: unknown): string {
  if (typeof valor !== "string") return "/";
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return "/";
  return valor;
}
