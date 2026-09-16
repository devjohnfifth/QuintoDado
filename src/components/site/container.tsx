import type { ElementType, ReactNode } from "react";

const LARGURAS = {
  /** Largura do site: header, rodapé, listas e grades. */
  padrao: "max-w-5xl px-4 sm:px-6 lg:px-[10vw]",
  /**
   * Coluna de leitura (legal, formulários). Sem a margem de 10vw: numa caixa
   * estreita ela come o conteúdo (foi o que quebrou o /sobre em telas largas).
   */
  texto: "max-w-3xl px-4 sm:px-6",
} as const;

/**
 * A caixa que alinha o site inteiro: mesmo máximo, mesmo respiro lateral e a
 * margem de 10% da tela no desktop (pedida pra quem usa zoom de 125%). Header,
 * rodapé e páginas usam este componente, então logo, conteúdo e rodapé
 * começam na mesma coluna.
 */
export function Container({
  children,
  className,
  largura = "padrao",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  largura?: keyof typeof LARGURAS;
  as?: ElementType;
}) {
  return (
    <Tag className={`mx-auto w-full ${LARGURAS[largura]} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
