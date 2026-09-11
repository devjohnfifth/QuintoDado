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
      disabled={pending}
      onClick={alternar}
      title={vendasAbertas ? "Clique pra bloquear as vendas" : "Clique pra liberar as vendas"}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        vendasAbertas
          ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          : "border-border text-muted-foreground hover:bg-accent"
      }`}
    >
      {pending ? "Aguarde..." : vendasAbertas ? "Vendas abertas" : "Vendas bloqueadas"}
    </button>
  );
}
