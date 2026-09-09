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
import { sairDaMesaAction } from "./actions";

export function SairDaMesaButton({ inscricaoId, slug }: { inscricaoId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await sairDaMesaAction(inscricaoId, slug);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Sair da mesa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair dessa mesa?</DialogTitle>
            <DialogDescription>
              Sua vaga fica livre pra outra pessoa. Isso não pode ser desfeito por aqui — se mudar
              de ideia, fale com o mestre.
            </DialogDescription>
          </DialogHeader>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={confirmar}>
              {pending ? "Saindo..." : "Sim, sair da mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
