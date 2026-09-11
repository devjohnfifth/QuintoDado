"use client";

import { useState, useTransition } from "react";
import { Copy, Check } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/format";
import { comprarIngressoAction } from "./actions";

export function ComprarIngressoButton({
  eventoId,
  tipoId,
  tipoNome,
  precoCentavos,
  slug,
  chavePix,
  whatsappConfirmacao,
  nomeCompletoAtual,
}: {
  eventoId: string;
  tipoId: string;
  tipoNome: string;
  precoCentavos: number;
  slug: string;
  chavePix: string | null;
  whatsappConfirmacao: string | null;
  nomeCompletoAtual: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [copiado, setCopiado] = useState(false);

  function copiarChave() {
    if (!chavePix) return;
    navigator.clipboard.writeText(chavePix).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function confirmar() {
    setErro(null);
    if (!nomeCompletoAtual && nomeCompleto.trim().length < 3) {
      setErro("Digite seu nome completo.");
      return;
    }
    startTransition(async () => {
      const resultado = await comprarIngressoAction({
        eventoId,
        tipoId,
        slug,
        nomeCompleto: nomeCompletoAtual ? undefined : nomeCompleto.trim(),
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        Comprar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoNome} — {formatBRL(precoCentavos)}
            </DialogTitle>
            <DialogDescription>
              Pague por Pix e mande o comprovante pelo WhatsApp. A gente confirma seu ingresso assim
              que conferir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!nomeCompletoAtual && (
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Seu nome completo</Label>
                <Input
                  id="nomeCompleto"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Pra constar no ingresso"
                  maxLength={160}
                />
              </div>
            )}

            {chavePix && (
              <div className="space-y-1.5">
                <Label>Chave Pix</Label>
                <button
                  type="button"
                  onClick={copiarChave}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-sm transition-colors hover:border-primary/40"
                >
                  <span className="truncate">{chavePix}</span>
                  {copiado ? (
                    <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </button>
              </div>
            )}

            {whatsappConfirmacao && (
              <p className="text-sm text-muted-foreground">
                Depois de pagar, manda o comprovante no WhatsApp{" "}
                <a
                  href={`https://wa.me/55${whatsappConfirmacao.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {whatsappConfirmacao}
                </a>
                .
              </p>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>

          <DialogFooter>
            <Button disabled={pending} onClick={confirmar} className="w-full">
              {pending ? "Enviando..." : "Já paguei, enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
