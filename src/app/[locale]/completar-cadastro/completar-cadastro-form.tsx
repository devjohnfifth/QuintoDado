"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { sanitizarUsername } from "@/lib/username";
import { completarCadastroAction } from "./actions";

export function CompletarCadastroForm({ nomeSugerido }: { nomeSugerido: string }) {
  const t = useTranslations("CompletarCadastro");
  const [estado, formAction, pending] = useActionState(completarCadastroAction, null);
  const [valores, setValores] = useState({
    nomeExibicao: nomeSugerido,
    nomeCompleto: "",
    username: "",
    dataNascimento: "",
  });

  // Depois de um erro, só limpa os campos que o servidor apontou como
  // inválidos — o resto do que a pessoa já preencheu certo continua ali.
  useEffect(() => {
    if (!estado?.valores) return;
    setValores((atual) => {
      const proximo = { ...atual };
      for (const campo of Object.keys(atual) as (keyof typeof atual)[]) {
        proximo[campo] = estado.camposInvalidos?.includes(campo)
          ? ""
          : (estado.valores?.[campo] ?? atual[campo]);
      }
      return proximo;
    });
  }, [estado]);

  const campo =
    (nome: keyof typeof valores, transformar?: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = transformar ? transformar(e.target.value) : e.target.value;
      setValores((atual) => ({ ...atual, [nome]: v }));
    };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeExibicao">{t("campoNome")}</Label>
        <Input
          id="nomeExibicao"
          name="nomeExibicao"
          required
          maxLength={80}
          value={valores.nomeExibicao}
          onChange={campo("nomeExibicao")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nomeCompleto">{t("campoNomeCompleto")}</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          maxLength={160}
          value={valores.nomeCompleto}
          onChange={campo("nomeCompleto")}
        />
        <p className="text-xs text-muted-foreground">{t("campoNomeCompletoAjuda")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">{t("campoUsername")}</Label>
        <Input
          id="username"
          name="username"
          required
          maxLength={30}
          value={valores.username}
          onChange={campo("username", sanitizarUsername)}
        />
        <p className="text-xs text-muted-foreground">
          Só letras minúsculas, números, - ou _. A gente ajusta pra esse formato enquanto você digita.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dataNascimento">{t("campoNascimento")}</Label>
        <Input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          required
          value={valores.dataNascimento}
          onChange={campo("dataNascimento")}
        />
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
