import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** Fundo de quando não há imagem: gradiente da marca com a textura hexagonal do site. */
export function FundoSemImagem({ icone: Icone }: { icone?: LucideIcon }) {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/40 to-secondary/40">
      {/* Textura numa camada própria: `backgroundImage` inline no mesmo elemento apagaria o gradiente. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='69' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1.5' opacity='0.15'/%3E%3C/svg%3E\")",
        }}
      />
      {Icone && <Icone className="relative size-10 text-white/70" />}
    </div>
  );
}

/**
 * Card com imagem em cima e texto embaixo — base de evento e suplemento.
 * `destaque` (lista com um item só) vira horizontal a partir do `sm`, com a
 * imagem à esquerda, pra não sobrar um cartão pequeno perdido na tela.
 */
export function CardMidia({
  href,
  imagem,
  iconeSemImagem,
  selosImagem,
  destaque = false,
  children,
}: {
  href: string;
  imagem: string | null;
  iconeSemImagem?: LucideIcon;
  /** Selos sobre a imagem, no canto superior. */
  selosImagem?: ReactNode;
  destaque?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full overflow-hidden rounded-2xl border border-border bg-card/60 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 ${
        destaque ? "flex-col sm:flex-row" : "flex-col"
      }`}
    >
      <div
        className={`relative w-full shrink-0 overflow-hidden ${destaque ? "aspect-[16/9] sm:aspect-auto sm:min-h-64 sm:w-1/2" : "aspect-[16/9]"}`}
      >
        {imagem ? (
          <Image
            src={imagem}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={destaque ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"}
          />
        ) : (
          <FundoSemImagem icone={iconeSemImagem} />
        )}
        {selosImagem && <div className="absolute inset-x-3 top-3 flex flex-wrap justify-between gap-2">{selosImagem}</div>}
      </div>
      <div className={`flex flex-1 flex-col ${destaque ? "p-5 sm:p-6" : "p-4"}`}>{children}</div>
    </Link>
  );
}
