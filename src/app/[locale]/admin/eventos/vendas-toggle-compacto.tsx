"use client";

import { useState, useTransition } from "react";
import { alternarVendasEventoAction } from "./actions";

export function VendasToggleCompacto({
  eventoId,
  vendasAbertas: vendasAbertasInicial,
}: {
  eventoId: string;
  vendasAbertas: boolean;
}) {
  const [vendasAbertas, setVendasAbertas] = useState(vendasAbertasInicial);
  const [pending, startTransition] = useTransition();

  function alternar() {
    const novoValor = !vendasAbertas;
    startTransition(async () => {
      try {
        await alternarVendasEventoAction(eventoId, novoValor);
        setVendasAbertas(novoValor);
      } catch {
        // erro visível com mais contexto na página de detalhe do evento
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={vendasAbertas}
      disabled={pending}
      onClick={alternar}
      title={vendasAbertas ? "Clique pra desligar as vendas" : "Clique pra ligar as vendas"}
      className="group flex items-center gap-2 disabled:opacity-60"
    >
      <span
        className={`relative block h-6 w-10 shrink-0 rounded-full p-0.5 shadow-inner transition-colors duration-300 ease-out ${
          vendasAbertas ? "bg-emerald-500" : "bg-[#3a3a46]"
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
            vendasAbertas ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium transition-colors duration-300 ${
          vendasAbertas ? "text-emerald-400" : "text-muted-foreground"
        }`}
      >
        {pending ? "..." : vendasAbertas ? "Venda ON" : "Venda OFF"}
      </span>
    </button>
  );
}
