"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Barra de salvar fixa no rodapé dos formulários do admin.
 *
 * O botão ficava só no fim de um formulário de vinte e tantos campos: pra
 * salvar uma correção de uma linha você rolava a tela inteira. Aqui ele fica
 * sempre à mão, e o erro aparece junto — antes a mensagem morava no fim e
 * quem estava no meio do formulário não via nada acontecer ao enviar.
 *
 * O aviso de saída só liga quando há mudança pendente: formulário longo é
 * onde fechar a aba sem querer dói mais.
 */
export function BarraSalvar({
  pendente,
  rotulo,
  rotuloPendente,
  erro,
  sujo,
}: {
  pendente: boolean;
  rotulo: string;
  rotuloPendente: string;
  erro?: string | null;
  /** Há alteração não salva? Liga o aviso do navegador ao sair. */
  sujo?: boolean;
}) {
  useEffect(() => {
    if (!sujo || pendente) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo, pendente]);

  return (
    <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
        <Button type="submit" disabled={pendente} className="w-full sm:ml-auto sm:w-auto">
          {pendente ? rotuloPendente : rotulo}
        </Button>
      </div>
    </div>
  );
}
