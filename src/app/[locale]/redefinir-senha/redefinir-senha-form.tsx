"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenhaAction } from "./actions";

export function RedefinirSenhaForm() {
  const t = useTranslations("Entrar");
  const [estado, formAction, pending] = useActionState(redefinirSenhaAction, null);

  return (
    <form action={formAction} className="mx-auto mt-8 max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="senha">{t("campoNovaSenha")}</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} autoFocus />
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("salvando") : t("salvarNovaSenha")}
      </Button>
    </form>
  );
}
