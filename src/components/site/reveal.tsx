import type { ReactNode } from "react";

/**
 * Revela o conteúdo (fade + slide sutil) quando ele entra na viewport.
 *
 * É só CSS (classe `revelar` em globals.css, com `animation-timeline: view()`):
 * o conteúdo já sai visível do servidor, então a página nunca aparece vazia
 * esperando JS. Navegador sem suporte ou com movimento reduzido só mostra,
 * sem animar.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`revelar ${className ?? ""}`}>{children}</div>;
}
