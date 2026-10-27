/**
 * Silhueta de d20 pra usar como marca d'água.
 *
 * O site não tinha nenhum elemento gráfico próprio — era só retângulo e
 * texto. Este d20 entra bem apagado atrás de capas e blocos de destaque: dá
 * assinatura sem competir com o conteúdo. É decorativo, então fica fora da
 * árvore de acessibilidade.
 */
export function D20MarcaDagua({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      className={className}
    >
      {/* Hexágono externo */}
      <path d="M50 2 L91.6 26 V74 L50 98 L8.4 74 V26 Z" />
      {/* Face central */}
      <path d="M50 26 L71 70 H29 Z" />
      {/* Arestas que ligam a face aos vértices alternados */}
      <path d="M50 26 V2 M71 70 L91.6 74 M29 70 L8.4 74" />
    </svg>
  );
}
