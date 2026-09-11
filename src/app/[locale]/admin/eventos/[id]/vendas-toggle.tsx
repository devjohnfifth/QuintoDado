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
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
          vendasAbertas ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
        }`}
      >
        {vendasAbertas ? <ShoppingCart className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{vendasAbertas ? "Venda ON" : "Venda OFF"}</p>
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
        aria-label={vendasAbertas ? "Venda ON — clique pra desligar" : "Venda OFF — clique pra ligar"}
        disabled={pending}
        onClick={alternar}
        className={`group relative h-8 w-[3.25rem] shrink-0 rounded-full p-1 shadow-inner transition-colors duration-300 ease-out disabled:opacity-60 ${
          vendasAbertas ? "bg-emerald-500" : "bg-[#3a3a46]"
        }`}
      >
        <span
          className={`block size-6 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
            vendasAbertas ? "translate-x-[1.375rem]" : "translate-x-0"
          }`}
        />
      </button>
      {erro && <p className="w-full text-xs text-destructive">{erro}</p>}
    </div>
  );
}
