import type { ReactNode } from "react";

/**
 * Grade de cards que se ajusta à quantidade: com um item só, ele ocupa a
 * largura toda em modo destaque; com dois, meia largura cada; com três ou
 * mais, vira grade normal.
 */
export function GradeAdaptavel<T>({
  itens,
  chave,
  render,
  colunas = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  itens: T[];
  chave: (item: T) => string;
  render: (item: T, destaque: boolean) => ReactNode;
  colunas?: string;
}) {
  if (itens.length === 1) return <div>{render(itens[0], true)}</div>;
  // Dois itens dividem a largura ao meio em vez de deixar a terceira coluna vazia.
  return (
    <ul className={`grid gap-4 ${itens.length === 2 ? "sm:grid-cols-2" : colunas}`}>
      {itens.map((item) => (
        <li key={chave(item)}>{render(item, false)}</li>
      ))}
    </ul>
  );
}
