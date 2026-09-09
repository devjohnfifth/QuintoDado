"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ titulo, url }: { titulo: string; url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        // usuário cancelou o share nativo — não faz nada
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex.: http sem permissão) — sem fallback visual
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {copiado ? (
        <>
          <Check className="size-3.5" aria-hidden />
          Link copiado
        </>
      ) : (
        <>
          <Share2 className="size-3.5" aria-hidden />
          Compartilhar
        </>
      )}
    </button>
  );
}
