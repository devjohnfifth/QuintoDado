"use client";

import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Trilha horizontal com rolagem por arraste/scroll e setas no desktop. Recebe
 * os cards já renderizados (podem ser de tipos diferentes — evento,
 * suplemento…), então serve pro carrossel de notícias da home.
 */
export function Carrossel({ itens }: { itens: { chave: string; conteudo: ReactNode }[] }) {
  const t = useTranslations("Home.eventos");
  const trilhaRef = useRef<HTMLUListElement>(null);

  function rolar(direcao: -1 | 1) {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    trilha.scrollBy({ left: direcao * trilha.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div>
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

      <div className="mt-3 hidden items-center justify-end gap-2 sm:flex">
        <button
          type="button"
          onClick={() => rolar(-1)}
          aria-label={t("anterior")}
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => rolar(1)}
          aria-label={t("proximo")}
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
