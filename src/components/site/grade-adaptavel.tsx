import type { ReactNode } from "react";

/**
 * Grade de cards que se ajusta à quantidade.
 *
 * O site tem poucos itens por lista, e três cards estreitos numa tela larga
 * deixavam metade da página vazia. Então a grade reage ao que tem: um item
 * ocupa a largura toda em destaque, dois dividem ao meio, e três viram
 * duas colunas com o último atravessando — que preenche a fileira em vez de
 * deixar um card órfão. De quatro em diante é grade normal.
 *
 * `cascata` (globals.css) faz os filhos entrarem conforme alcançam a tela.
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
  if (itens.length === 1) return <div className="cascata">{render(itens[0], true)}</div>;

  const tres = itens.length === 3;
  const poucos = itens.length === 2 || tres;

  return (
    <ul className={`cascata grid gap-4 ${poucos ? "sm:grid-cols-2" : colunas}`}>
      {itens.map((item, i) => {
        // No trio, o terceiro atravessa as duas colunas e entra em modo
        // destaque (capa à esquerda, texto à direita).
        const atravessa = tres && i === 2;
        return (
          <li key={chave(item)} className={atravessa ? "sm:col-span-2" : undefined}>
            {render(item, atravessa)}
          </li>
        );
      })}
    </ul>
  );
}
