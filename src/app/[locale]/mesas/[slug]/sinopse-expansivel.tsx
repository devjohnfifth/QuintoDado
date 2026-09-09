"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function SinopseExpansivel({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  // Só vale a pena ter o botão se o texto for realmente longo — abaixo
  // disso o line-clamp nem cortaria nada, e o botão apareceria à toa.
  const ehLongo = texto.length > 220;

  return (
    <div className="mt-4">
      <p className={`text-muted-foreground ${!aberto && ehLongo ? "line-clamp-3" : ""}`}>{texto}</p>
      {ehLongo && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {aberto ? "Ler menos" : "Ler mais"}
          <ChevronDown className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden />
        </button>
      )}
    </div>
  );
}
