import type { ReactNode } from "react";

/**
 * Grade que se ajusta à quantidade de itens.
 *
 * Duas variantes, porque o site tem dois formatos de card:
 *
 * - `cards` (padrão): cards verticais, como suplemento e evento. O site tem
 *   poucos itens por lista, e três cards estreitos numa tela larga deixavam
 *   metade da página vazia — então um item ocupa a largura toda em destaque,
 *   dois dividem ao meio, e três viram duas colunas com o último
 *   atravessando, pra não sobrar card órfão.
 *
 * - `lista`: cards horizontais, como a mesa. Eles não cabem em três colunas.
 *   Até quatro, uma coluna só, pra cada mesa ter presença; de cinco em
 *   diante, duas colunas, senão a página fica comprida demais.
 *
 * `cascata` (globals.css) faz os filhos entrarem conforme alcançam a tela.
 */
export function GradeAdaptavel<T>({
  itens,
  chave,
  render,
  colunas = "sm:grid-cols-2 lg:grid-cols-3",
  variante = "cards",
}: {
  itens: T[];
  chave: (item: T) => string;
  /** `destaque` só é usado na variante `cards`; em `lista` vem sempre false. */
  render: (item: T, destaque: boolean) => ReactNode;
  colunas?: string;
  variante?: "cards" | "lista";
}) {
  if (variante === "lista") {
    return (
      <ul className={`cascata grid gap-4 ${itens.length > 4 ? "xl:grid-cols-2" : ""}`}>
        {itens.map((item) => (
          <li key={chave(item)}>{render(item, false)}</li>
        ))}
      </ul>
    );
  }

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
