"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { completarCadastroAction } from "./actions";

export function CompletarCadastroForm({ nomeSugerido }: { nomeSugerido: string }) {
  const t = useTranslations("CompletarCadastro");
  const [estado, formAction, pending] = useActionState(completarCadastroAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeExibicao">{t("campoNome")}</Label>
        <Input
          id="nomeExibicao"
          name="nomeExibicao"
          required
          maxLength={80}
          defaultValue={nomeSugerido}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">{t("campoUsername")}</Label>
        <Input id="username" name="username" required maxLength={30} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dataNascimento">{t("campoNascimento")}</Label>
        <Input id="dataNascimento" name="dataNascimento" type="date" required />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="aceiteTermos" name="aceiteTermos" required className="mt-0.5" />
        <Label htmlFor="aceiteTermos" className="font-normal text-xs leading-snug">
          {t("aceiteTermosPre")}{" "}
          <Link href="/termos" className="text-primary hover:underline">
            {t("aceiteTermosLink")}
          </Link>
        </Label>
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("enviando") : t("enviar")}
      </Button>
    </form>
  );
}
