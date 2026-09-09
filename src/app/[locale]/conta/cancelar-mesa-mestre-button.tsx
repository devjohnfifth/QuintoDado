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
import { cancelarMesaMestreAction } from "../presencial-bh/[id]/actions";

export function CancelarMesaMestreButton({ mesaId }: { mesaId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await cancelarMesaMestreAction(mesaId);
        setOpen(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra cancelar a mesa.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-destructive hover:underline"
      >
        Cancelar
      </button>
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
            <Button variant="destructive" disabled={pending} onClick={confirmar}>
              {pending ? "Cancelando..." : "Sim, cancelar mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
