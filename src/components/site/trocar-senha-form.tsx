"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trocarSenhaAction } from "@/app/[locale]/conta/actions";

export function TrocarSenhaForm() {
  const t = useTranslations("Conta");
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function fechar() {
    setAberto(false);
    setErro(null);
    setSucesso(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    const formData = new FormData(e.currentTarget);
    const senhaAtual = formData.get("senhaAtual");
    const novaSenha = formData.get("novaSenha");
    const confirmarSenha = formData.get("confirmarSenha");

    if (novaSenha !== confirmarSenha) {
      setErro(t("senhaNaoBate"));
      return;
    }

    startTransition(async () => {
      const resultado = await trocarSenhaAction({ senhaAtual, novaSenha });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setSucesso(true);
      e.currentTarget.reset();
    });
  }

  return (
    /* O título da seção é da página (que usa um só pra todas); aqui fica
       só o botão e o formulário. */
    <div>
      {!aberto && (
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAberto(true)}>
          {t("trocarSenha")}
        </Button>
      )}

      {aberto && (
        <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-xl border border-border bg-card/40 p-5">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">{t("senhaAtual")}</Label>
            <Input id="senhaAtual" name="senhaAtual" type="password" autoComplete="current-password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="novaSenha">{t("novaSenha")}</Label>
            <Input
              id="novaSenha"
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">{t("confirmarNovaSenha")}</Label>
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
          {sucesso && <p className="text-sm text-sucesso">{t("senhaAlterada")}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? t("salvando") : t("salvarNovaSenha")}
            </Button>
            <Button type="button" variant="outline" onClick={fechar}>
              {sucesso ? t("fechar") : t("cancelar")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
