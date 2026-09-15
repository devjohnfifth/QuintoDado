/**
 * Serializa um objeto pra dentro de uma tag `<script type="application/ld+json">`.
 *
 * `JSON.stringify` sozinho NÃO é seguro aqui: ele não escapa `<`, então um
 * texto vindo do banco que contenha `</script>` fecha a tag no meio do
 * caminho e tudo depois disso passa a ser interpretado como HTML vivo da
 * página — é XSS clássico. Como a sinopse da mesa entra no JSON-LD e é
 * escrita por qualquer mestre cadastrado, isso é entrada não confiável.
 *
 * Escapar `<`, `>` e `&` resolve: continua sendo JSON válido (o parser
 * resolve os escapes) e o parser de HTML nunca vê um `</script>`.
 */
export function jsonLdSeguro(dados: unknown): string {
  return JSON.stringify(dados)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
