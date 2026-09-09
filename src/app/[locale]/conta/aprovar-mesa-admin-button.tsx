"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { aprovarMesaAction } from "../admin/mesas/actions";

export function AprovarMesaAdminButton({ mesaId }: { mesaId: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErro(null);
            try {
              await aprovarMesaAction(mesaId);
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Não deu pra aprovar a mesa.");
            }
          })
        }
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline disabled:opacity-50"
      >
        <Check className="size-3.5" aria-hidden />
        {pending ? "Aprovando..." : "Aprovar"}
      </button>
      {erro && <span className="text-xs text-destructive">{erro}</span>}
    </span>
  );
}
