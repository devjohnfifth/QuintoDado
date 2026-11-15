"use client";

import { useTranslations } from "next-intl";

import { useEffect, useState, useTransition } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
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
import { comprarIngressoAction, dadosPagamentoAction } from "./actions";

export function ComprarIngressoButton({
  eventoId,
  tipoId,
  tipoNome,
  precoCentavos,
  slug,
  nomeCompletoAtual,
  telefoneAtual,
}: {
  eventoId: string;
  tipoId: string;
  tipoNome: string;
  precoCentavos: number;
  slug: string;
  nomeCompletoAtual: string | null;
  telefoneAtual: string | null;
}) {
  const t = useTranslations("Eventos");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [copiado, setCopiado] = useState(false);
  // Chave Pix e WhatsApp chegam só quando o diálogo abre, e só pra quem tem
  // sessão — nunca junto com a página.
  const [chavePix, setChavePix] = useState<string | null>(null);
  const [whatsappConfirmacao, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    dadosPagamentoAction(slug).then((r) => {
      if (cancelado || !r.ok) return;
      setChavePix(r.chavePix);
      setWhatsapp(r.whatsapp);
    });
    return () => {
      cancelado = true;
    };
  }, [open, slug]);

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
      setErro(t("erroNomeCompleto"));
      return;
    }
    if (!telefoneAtual && telefone.replace(/\D/g, "").length < 10) {
      setErro(t("erroTelefone"));
      return;
    }
    startTransition(async () => {
      const resultado = await comprarIngressoAction({
        eventoId,
        tipoId,
        slug,
        nomeCompleto: nomeCompletoAtual ? undefined : nomeCompleto.trim(),
        telefone: telefoneAtual ? undefined : telefone.trim(),
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
      <Button variant="marca" className="w-full" onClick={() => setOpen(true)}>
        {t("comprar")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoNome} — {formatBRL(precoCentavos)}
            </DialogTitle>
            <DialogDescription>{t("compraDescricao")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!nomeCompletoAtual && (
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">{t("campoNomeCompleto")}</Label>
                <Input
                  id="nomeCompleto"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder={t("campoNomeCompletoPlaceholder")}
                  maxLength={160}
                />
              </div>
            )}

            {!telefoneAtual && (
              <div className="space-y-2">
                <Label htmlFor="telefone">{t("campoTelefone")}</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="31999999999"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Pra gente conseguir te achar se o comprovante não chegar pelo WhatsApp.
                </p>
              </div>
            )}

            {chavePix && (
              <div className="space-y-1.5">
                <Label>{t("campoChavePix")}</Label>
                <button
                  type="button"
                  onClick={copiarChave}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-sm transition-colors hover:border-primary/40"
                >
                  <span className="truncate">{chavePix}</span>
                  {copiado ? (
                    <Check className="size-4 shrink-0 text-sucesso" aria-hidden />
                  ) : (
                    <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </button>
              </div>
            )}

            {whatsappConfirmacao && (
              <div className="space-y-2 rounded-lg border border-alerta/30 bg-alerta/5 p-3">
                <a
                  href={`https://wa.me/55${whatsappConfirmacao.replace(/\D/g, "")}?text=${encodeURIComponent(
                    t("whatsappMensagem", { tipo: tipoNome }),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-sucesso/90 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sucesso"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                  {t("abrirWhatsapp")}
                </a>
                <p className="text-xs text-muted-foreground">
                  Se não abrir sozinho, copia o número <strong className="text-foreground">{whatsappConfirmacao}</strong>{" "}
                  e manda o comprovante por lá na mão.{" "}
                  <strong className="text-foreground">{t("semComprovante")}</strong>
                </p>
              </div>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>

          <DialogFooter>
            <Button variant="marca" disabled={pending} onClick={confirmar} className="w-full">
              {pending ? t("enviando") : t("jaPaguei")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
