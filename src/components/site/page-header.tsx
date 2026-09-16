import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Topo padrão das páginas de listagem: ícone da seção, título, subtítulo e ações à direita. */
export function PageHeader({
  icone: Icone,
  titulo,
  subtitulo,
  acoes,
}: {
  icone: LucideIcon;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icone className="size-5" aria-hidden />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
