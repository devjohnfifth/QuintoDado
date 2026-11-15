"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { cancelarMesaMestreAction } from "../mesas/candidaturas/[id]/actions";

export function CancelarMesaMestreButton({ mesaId }: { mesaId: string }) {
  const t = useTranslations("Conta");
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
        setErro(e instanceof Error ? e.message : t("erroCancelarMesa"));
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
        {t("cancelar")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelarMesaTitulo")}</DialogTitle>
            <DialogDescription>{t("cancelarMesaCorpo")}</DialogDescription>
          </DialogHeader>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t("voltar")}</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={confirmar}>
              {pending ? t("cancelando") : t("confirmarCancelarMesa")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
