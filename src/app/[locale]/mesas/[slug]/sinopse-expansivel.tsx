"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DescricaoMarkdown } from "@/components/site/descricao-markdown";

export function SinopseExpansivel({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  // Só vale a pena ter o botão se o texto for realmente longo — abaixo
  // disso o corte nem aconteceria, e o botão apareceria à toa.
  const ehLongo = texto.length > 600;

  return (
    <div className="mt-4 max-w-2xl">
      {/* Corte por altura, não por linha: line-clamp em conteúdo com título e
          imagem corta no meio do elemento e fica feio. */}
      <div className={`relative ${!aberto && ehLongo ? "max-h-72 overflow-hidden" : ""}`}>
        <DescricaoMarkdown texto={texto} />
        {!aberto && ehLongo && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent"
          />
        )}
      </div>
      {ehLongo && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {aberto ? "Ler menos" : "Ler mais"}
          <ChevronDown className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden />
        </button>
      )}
    </div>
  );
}
