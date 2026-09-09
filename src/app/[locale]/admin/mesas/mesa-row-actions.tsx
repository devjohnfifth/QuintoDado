"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aprovarMesaAction, cancelarMesaAction } from "./actions";

export function MesaRowActions({ mesaId, status }: { mesaId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aprovarMesaAction(mesaId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra aprovar a mesa.");
      }
    });
  }

  function cancelar() {
    setErro(null);
    startTransition(async () => {
      try {
        await cancelarMesaAction(mesaId);
        setOpen(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra cancelar a mesa.");
      }
    });
  }

  if (status === "aguardando_aprovacao") {
    return (
      <div>
        <Button size="sm" disabled={pending} onClick={aprovar}>
          {pending ? "Aprovando..." : "Aprovar"}
        </Button>
        {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
      </div>
    );
  }

  if (status === "publicada" || status === "confirmada") {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Cancelar
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar essa mesa?</DialogTitle>
              <DialogDescription>
                A mesa some da listagem pública e para de aceitar candidaturas. Isso não pode ser
                desfeito por aqui.
              </DialogDescription>
            </DialogHeader>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Voltar</DialogClose>
              <Button variant="destructive" disabled={pending} onClick={cancelar}>
                {pending ? "Cancelando..." : "Sim, cancelar mesa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
