"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { aprovarInscricaoAction, recusarInscricaoAction } from "./actions";

export function InscricaoActions({
  inscricaoId,
  mesaId,
}: {
  inscricaoId: string;
  mesaId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aprovarInscricaoAction(inscricaoId, mesaId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra aprovar a candidatura.");
      }
    });
  }

  function recusar() {
    setErro(null);
    startTransition(async () => {
      try {
        await recusarInscricaoAction(inscricaoId, mesaId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra recusar a candidatura.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={aprovar}>
          {pending ? "Aguarde..." : "Aprovar"}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={recusar}>
          {pending ? "Aguarde..." : "Recusar"}
        </Button>
      </div>
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}
    </div>
  );
}
