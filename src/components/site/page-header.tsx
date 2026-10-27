import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const TAMANHOS = {
  /** Topo de página pública: o maior título depois do herói da home. */
  pagina: "titulo-pagina",
  /** Topo de uma área interna (painel da mesa), onde o título não compete. */
  secao: "titulo-secao",
} as const;

/**
 * Topo padrão das páginas de listagem: ícone da seção, título, subtítulo e
 * ações à direita.
 *
 * O ícone é âmbar e grande de propósito — é o único ponto quente antes do
 * conteúdo, e era o que faltava pra página não abrir cinza.
 */
export function PageHeader({
  icone: Icone,
  titulo,
  subtitulo,
  acoes,
  tamanho = "pagina",
}: {
  icone: LucideIcon;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  tamanho?: keyof typeof TAMANHOS;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-acento/15 text-acento">
          <Icone className="size-6" aria-hidden />
        </div>
        <h1 className={`titulo-display mt-5 ${TAMANHOS[tamanho]}`}>{titulo}</h1>
        {subtitulo && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
