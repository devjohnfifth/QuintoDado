"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportarIngressosAction } from "./actions";

/**
 * Baixa a lista completa de pedidos em CSV (nome completo, e-mail, telefone,
 * ingresso, status). O arquivo é montado no servidor e vira download aqui,
 * sem passar por nenhum serviço de fora.
 */
export function ExportarIngressos({ eventoId }: { eventoId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function exportar() {
    setErro(null);
    startTransition(async () => {
      const r = await exportarIngressosAction(eventoId);
      if (!r.ok) return setErro(r.error);

      const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = r.nome;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" className="rounded-full" onClick={exportar} disabled={pendente}>
        {pendente ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" aria-hidden />}
        Exportar lista (CSV)
      </Button>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
