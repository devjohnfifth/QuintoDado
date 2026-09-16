import type { ReactNode } from "react";

/**
 * Grade de cards que se ajusta à quantidade: com um item só, ele ocupa a
 * largura toda em modo destaque; com dois ou mais, vira grade normal.
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
  return (
    <ul className={`grid gap-4 ${colunas}`}>
      {itens.map((item) => (
        <li key={chave(item)}>{render(item, false)}</li>
      ))}
    </ul>
  );
}
