import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Caixa de "nada por aqui" das listagens: ícone, título, explicação e uma ação opcional. */
export function EstadoVazio({
  icone: Icone,
  imagem,
  titulo,
  corpo,
  acao,
}: {
  icone?: LucideIcon;
  imagem?: ReactNode;
  titulo: ReactNode;
  corpo?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      {imagem ??
        (Icone && (
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icone className="size-6" aria-hidden />
          </div>
        ))}
      <p className="mt-4 font-heading text-lg font-bold">{titulo}</p>
      {corpo && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{corpo}</p>}
      {acao && <div className="mt-6 flex justify-center">{acao}</div>}
    </div>
  );
}
