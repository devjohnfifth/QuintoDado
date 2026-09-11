"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventoCard, type EventoCardData } from "./evento-card";

export function EventoCarousel({ eventos }: { eventos: EventoCardData[] }) {
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
        {eventos.map((evento) => (
          <div key={evento.slug} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
            <EventoCard evento={evento} />
          </div>
        ))}
      </div>

      {eventos.length > 2 && (
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
