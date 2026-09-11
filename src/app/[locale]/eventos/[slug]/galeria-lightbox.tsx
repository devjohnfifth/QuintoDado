"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function GaleriaLightbox({ imagens }: { imagens: string[] }) {
  const [aberta, setAberta] = useState<number | null>(null);

  function mudar(delta: number) {
    setAberta((atual) => {
      if (atual === null) return atual;
      return (atual + delta + imagens.length) % imagens.length;
    });
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imagens.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAberta(i)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 640px) 33vw, 50vw"
            />
          </button>
        ))}
      </div>

      <Dialog open={aberta !== null} onOpenChange={(v) => !v && setAberta(null)}>
        <DialogContent
          showCloseButton
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-3xl"
        >
          {aberta !== null && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <Image src={imagens[aberta]} alt="" fill className="object-contain" sizes="100vw" priority />
              {imagens.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => mudar(-1)}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => mudar(1)}
                    aria-label="Próxima foto"
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
