import type { ReactNode } from "react";

/**
 * Bloco de um formulário do admin.
 *
 * Os formulários de mesa e de evento são longos (mais de vinte campos cada)
 * e vinham como um fluxo único de rótulos. Sem divisão, não dá pra saber
 * onde você está nem o que falta — e, voltando pra editar, você relê tudo
 * pra achar um campo. Cada bloco responde uma pergunta.
 */
export function SecaoForm({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl painel p-5">
      <h2 className="titulo-display titulo-bloco">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
