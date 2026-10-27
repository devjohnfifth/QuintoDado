import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { BrilhoCursor } from "@/components/site/brilho-cursor";

/** Número estável entre 0 e 1 a partir de um texto — mesma capa pro mesmo item, sempre. */
function semente(texto: string) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 100000;
  return h / 100000;
}

/**
 * Fundo de quando não há imagem.
 *
 * Varia por item (`chave`): ângulo, cores e trama mudam, então uma grade de
 * cards sem capa deixa de ser cinco retângulos idênticos — tudo dentro do
 * azul e do roxo da marca, sem cor de fora da paleta.
 */
export function FundoSemImagem({ icone: Icone, chave = "" }: { icone?: LucideIcon; chave?: string }) {
  const s = semente(chave);
  const angulo = Math.round(120 + s * 140);
  const matiz = Math.round(s * 60) - 20;
  const trama = s > 0.66 ? "losango" : s > 0.33 ? "hex-grande" : "hex";

  const PADROES: Record<string, string> = {
    hex: "%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='69' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1.5' opacity='0.16'/%3E%3C/svg%3E",
    "hex-grande":
      "%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='126' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1' opacity='0.2'/%3E%3C/svg%3E",
    losango:
      "%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 2 L46 24 L24 46 L2 24 Z' fill='none' stroke='%23F5F5FA' stroke-width='1.2' opacity='0.14'/%3E%3C/svg%3E",
  };

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(${angulo}deg, color-mix(in oklch, var(--qd-primaria) 55%, transparent), color-mix(in oklch, var(--qd-secundaria) 55%, transparent))`,
        filter: `hue-rotate(${matiz}deg)`,
      }}
    >
      {/* Trama numa camada própria: `backgroundImage` no mesmo elemento apagaria o gradiente. */}
      <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,${PADROES[trama]}")` }} />
      {/* Clarão deslocado por item: dá volume e evita o aspecto de cor chapada. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(60% 70% at ${Math.round(20 + s * 60)}% ${Math.round(10 + s * 40)}%, color-mix(in oklch, var(--qd-secundaria) 45%, transparent), transparent 70%)`,
        }}
      />
      {Icone && <Icone className="relative size-10 text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" />}
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
      className={`group elevar hover:elevar-hover flex h-full overflow-hidden rounded-2xl painel ${
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
          <FundoSemImagem icone={iconeSemImagem} chave={href} />
        )}
        <BrilhoCursor cor="var(--qd-secundaria)" />
        {selosImagem && <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap justify-between gap-2">{selosImagem}</div>}
      </div>
      <div className={`flex flex-1 flex-col ${destaque ? "p-5 sm:p-6" : "p-4"}`}>{children}</div>
    </Link>
  );
}
