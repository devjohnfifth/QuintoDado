"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { mudarStatusEventoAction } from "../actions";

export function EventoStatusActions({ eventoId, status }: { eventoId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function mudar(novoStatus: "publicado" | "encerrado" | "cancelado") {
    setErro(null);
    startTransition(async () => {
      try {
        await mudarStatusEventoAction(eventoId, novoStatus);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra atualizar o evento.");
      }
    });
  }

  if (status !== "rascunho" && status !== "publicado") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "rascunho" && (
        <Button size="sm" disabled={pending} onClick={() => mudar("publicado")}>
          {pending ? "Aguarde..." : "Publicar"}
        </Button>
      )}
      {status === "publicado" && (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => mudar("encerrado")}>
            Encerrar
          </Button>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => mudar("cancelado")}>
            Cancelar
          </Button>
        </>
      )}
      {erro && <p className="w-full text-xs text-destructive">{erro}</p>}
    </div>
  );
}
