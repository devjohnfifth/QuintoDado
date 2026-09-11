"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Lock } from "lucide-react";
import { alternarVendasEventoAction } from "../actions";

export function VendasToggle({
  eventoId,
  vendasAbertas: vendasAbertasInicial,
}: {
  eventoId: string;
  vendasAbertas: boolean;
}) {
  const [vendasAbertas, setVendasAbertas] = useState(vendasAbertasInicial);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar() {
    setErro(null);
    const novoValor = !vendasAbertas;
    startTransition(async () => {
      try {
        await alternarVendasEventoAction(eventoId, novoValor);
        setVendasAbertas(novoValor);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra atualizar as vendas.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 p-4">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          vendasAbertas ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
        }`}
      >
        {vendasAbertas ? <ShoppingCart className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{vendasAbertas ? "Vendas abertas" : "Vendas bloqueadas"}</p>
        <p className="text-xs text-muted-foreground">
          {vendasAbertas
            ? "Quem visitar a página do evento pode comprar ingresso."
            : "A página mostra os ingressos, mas ninguém consegue comprar até você liberar."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={vendasAbertas}
        disabled={pending}
        onClick={alternar}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          vendasAbertas ? "bg-emerald-500" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
            vendasAbertas ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
      {erro && <p className="w-full text-xs text-destructive">{erro}</p>}
    </div>
  );
}
