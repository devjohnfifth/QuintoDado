"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Trilha horizontal com rolagem por arraste/scroll. Recebe os cards já
 * renderizados (podem ser de tipos diferentes — evento, suplemento…), então
 * serve pro carrossel de notícias da home.
 *
 * No celular não havia nada indicando que a trilha continuava: os cards eram
 * cortados na borda e pareciam quebrados. Agora há bolinhas de posição, e um
 * degradê nas pontas mostra de que lado tem mais conteúdo.
 */
export function Carrossel({ itens }: { itens: { chave: string; conteudo: ReactNode }[] }) {
  const t = useTranslations("Home.eventos");
  const trilhaRef = useRef<HTMLUListElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(true);

  useEffect(() => {
    const trilha = trilhaRef.current;
    if (!trilha) return;

    function medir() {
      const el = trilhaRef.current;
      if (!el) return;
      const sobra = el.scrollWidth - el.clientWidth;
      setTemAntes(el.scrollLeft > 8);
      setTemDepois(el.scrollLeft < sobra - 8);
      // Item mais próximo da borda esquerda da trilha.
      const passo = el.scrollWidth / Math.max(itens.length, 1);
      setAtivo(Math.min(itens.length - 1, Math.round(el.scrollLeft / passo)));
    }

    medir();
    trilha.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      trilha.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [itens.length]);

  function rolar(direcao: -1 | 1) {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    trilha.scrollBy({ left: direcao * trilha.clientWidth * 0.8, behavior: "smooth" });
  }

  function irPara(i: number) {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const alvo = trilha.children[i] as HTMLElement | undefined;
    alvo?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  return (
    <div className="relative">
      {/* Degradês de ponta: dizem que a trilha continua, sem ocupar espaço. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 ${
          temAntes ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 ${
          temDepois ? "opacity-100" : "opacity-0"
        }`}
      />

      <ul
        ref={trilhaRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {itens.map((item) => (
          <li key={item.chave} className="w-[270px] shrink-0 snap-start sm:w-[300px]">
            {item.conteudo}
          </li>
        ))}
      </ul>

      {/* Celular: bolinhas de posição. Desktop: setas. */}
      <div className="mt-4 flex justify-center gap-2 sm:hidden">
        {itens.map((item, i) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => irPara(i)}
            aria-label={t("irPara", { n: i + 1 })}
            aria-current={i === ativo}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === ativo ? "w-6 bg-primary" : "w-1.5 bg-foreground/25"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 hidden items-center justify-end gap-2 sm:flex">
        <button
          type="button"
          onClick={() => rolar(-1)}
          aria-label={t("anterior")}
          disabled={!temAntes}
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => rolar(1)}
          aria-label={t("proximo")}
          disabled={!temDepois}
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
