"use client";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Mesas");
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
        {t("sairDaMesa")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sairTitulo")}</DialogTitle>
            <DialogDescription>{t("sairCorpo")}</DialogDescription>
          </DialogHeader>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t("sairCancelar")}</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={confirmar}>
              {pending ? t("saindo") : t("sairConfirmar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
