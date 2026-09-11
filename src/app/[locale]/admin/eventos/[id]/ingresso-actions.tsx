"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aprovarIngressoAction, recusarIngressoAction } from "./actions";

export function IngressoActions({ ingressoId, eventoId }: { ingressoId: string; eventoId: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aprovarIngressoAction(ingressoId, eventoId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra aprovar o ingresso.");
      }
    });
  }

  function recusar() {
    setErro(null);
    startTransition(async () => {
      try {
        await recusarIngressoAction(ingressoId, eventoId, motivo.trim() || undefined);
        setOpen(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra recusar o ingresso.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={aprovar}>
          {pending ? "Aguarde..." : "Aprovar"}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
          Recusar
        </Button>
      </div>
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar esse ingresso?</DialogTitle>
            <DialogDescription>
              Se quiser, escreva um motivo — ele vai junto na notificação que a pessoa recebe. É
              opcional.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: não recebemos o comprovante do Pix."
            rows={3}
            maxLength={300}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={recusar}>
              {pending ? "Recusando..." : "Recusar ingresso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
