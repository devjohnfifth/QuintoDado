"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { aprovarMesaAction } from "../admin/mesas/actions";

export function AprovarMesaAdminButton({ mesaId }: { mesaId: string }) {
  const t = useTranslations("Conta");
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
              setErro(e instanceof Error ? e.message : t("erroAprovarMesa"));
            }
          })
        }
        className="inline-flex items-center gap-1 text-xs font-medium text-sucesso hover:underline disabled:opacity-50"
      >
        <Check className="size-3.5" aria-hidden />
        {pending ? t("aprovando") : t("aprovar")}
      </button>
      {erro && <span className="text-xs text-destructive">{erro}</span>}
    </span>
  );
}
