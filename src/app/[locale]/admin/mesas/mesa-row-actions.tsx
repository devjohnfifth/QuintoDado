"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { aprovarMesaAction, cancelarMesaAction } from "./actions";

export function MesaRowActions({ mesaId, status }: { mesaId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status === "aguardando_aprovacao") {
    return (
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => aprovarMesaAction(mesaId))}
      >
        {pending ? "Aprovando..." : "Aprovar"}
      </Button>
    );
  }

  if (status === "publicada" || status === "confirmada") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => cancelarMesaAction(mesaId))}
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </Button>
    );
  }

  return null;
}
