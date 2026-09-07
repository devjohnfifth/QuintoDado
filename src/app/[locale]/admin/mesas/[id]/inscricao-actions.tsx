"use client";

import { useTransition } from "react";
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

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => aprovarInscricaoAction(inscricaoId, mesaId))}
      >
        Aprovar
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => recusarInscricaoAction(inscricaoId, mesaId))}
      >
        Recusar
      </Button>
    </div>
  );
}
