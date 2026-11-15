"use client";

import { useTranslations } from "next-intl";

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
import { aprovarInscricaoMestreAction, recusarInscricaoMestreAction } from "./actions";

export function InscricaoActionsMestre({
  inscricaoId,
  mesaId,
}: {
  inscricaoId: string;
  mesaId: string;
}) {
  const t = useTranslations("Candidaturas");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aprovarInscricaoMestreAction(inscricaoId, mesaId);
      } catch (e) {
        setErro(e instanceof Error ? e.message : t("erroAprovar"));
      }
    });
  }

  function recusar() {
    setErro(null);
    startTransition(async () => {
      try {
        await recusarInscricaoMestreAction(inscricaoId, mesaId, motivo.trim() || undefined);
        setOpen(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : t("erroRecusar"));
      }
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={aprovar}>
          {pending ? t("aguarde") : t("aprovar")}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
          {t("recusar")}
        </Button>
      </div>
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recusarTitulo")}</DialogTitle>
            <DialogDescription>{t("recusarCorpo")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={t("recusarMotivoPlaceholder")}
            rows={3}
            maxLength={300}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t("cancelar")}</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={recusar}>
              {pending ? t("recusando") : t("recusarConfirmar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
