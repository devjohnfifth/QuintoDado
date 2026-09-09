"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { solicitarMestreAction } from "./actions";

export function SolicitarMestreButton({ jaSolicitado }: { jaSolicitado: boolean }) {
  const [enviado, setEnviado] = useState(jaSolicitado);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (enviado) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-400">
        <Check className="size-4 shrink-0" aria-hidden />
        Pedido enviado! A gente avisa quando for aprovado.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErro(null);
            const resultado = await solicitarMestreAction();
            if (!resultado.ok) {
              setErro(resultado.error);
              return;
            }
            setEnviado(true);
          })
        }
      >
        <UserPlus className="size-4" aria-hidden />
        {pending ? "Enviando..." : "Quero ser mestre de mesas presenciais em BH"}
      </Button>
      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
    </div>
  );
}
