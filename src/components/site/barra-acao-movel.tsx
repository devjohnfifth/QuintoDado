import type { ReactNode } from "react";

/**
 * Barra fixa no rodapé da tela, só no celular, com a ação principal da página
 * (comprar ingresso, se candidatar). A página que usa precisa reservar espaço
 * embaixo (`pb-24 sm:pb-0`) pra barra não cobrir o fim do conteúdo.
 */
export function BarraAcaoMovel({ rotulo, acao }: { rotulo?: ReactNode; acao: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md sm:hidden">
      <div className="flex items-center justify-between gap-3">
        {rotulo && <p className="min-w-0 truncate text-sm font-medium">{rotulo}</p>}
        <div className={rotulo ? "shrink-0" : "w-full [&>*]:w-full"}>{acao}</div>
      </div>
    </div>
  );
}
