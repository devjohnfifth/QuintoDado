"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Carrossel({
  itens,
  itemClassName = "w-[280px] shrink-0 snap-start sm:w-[320px]",
}: {
  itens: { chave: string; conteudo: ReactNode }[];
  itemClassName?: string;
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);

  function rolar(direcao: "esquerda" | "direita") {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const distancia = trilha.clientWidth * 0.8;
    trilha.scrollBy({ left: direcao === "esquerda" ? -distancia : distancia, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trilhaRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {itens.map((item) => (
          <div key={item.chave} className={itemClassName}>
            {item.conteudo}
          </div>
        ))}
      </div>

      {itens.length > 2 && (
        <div className="mt-3 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => rolar("esquerda")}
            aria-label="Anterior"
            className="flex size-8 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => rolar("direita")}
            aria-label="Próximo"
            className="flex size-8 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
