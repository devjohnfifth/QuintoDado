import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONS = {
  marca: "bg-primary/15 text-primary",
  sucesso: "bg-sucesso/15 text-sucesso",
  alerta: "bg-alerta/15 text-alerta",
  erro: "bg-erro/15 text-erro",
  neutro: "border border-border bg-card/60 text-muted-foreground",
  /** Sobre imagem: fundo escuro opaco pra ler em cima de qualquer arte. */
  imagem: "bg-black/75 text-white backdrop-blur-sm",
  solido: "bg-primary text-primary-foreground",
} as const;

export type TomSelo = keyof typeof TONS;

/** Etiqueta curta (tipo, preço, status). Nunca menor que 12 px, pra ler no celular. */
export function Selo({
  children,
  tom = "marca",
  icone: Icone,
  className,
}: {
  children: ReactNode;
  tom?: TomSelo;
  icone?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5",
        TONS[tom],
        className,
      )}
    >
      {Icone && <Icone className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
