"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import discordIcon from "@/assets/brand/discord-icon.png";
import googleIcon from "@/assets/brand/google-icon.png";
import {
  entrarComEmailAction,
  entrarComProvedorAction,
  criarContaAction,
} from "./actions";

export function EntrarForm({ mensagemInicial }: { mensagemInicial?: string }) {
  const t = useTranslations("Entrar");
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");

  return (
    <div className="mx-auto max-w-sm">
      {mensagemInicial && (
        <p className="mb-6 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          {mensagemInicial}
        </p>
      )}

      <div className="space-y-3">
        <form action={entrarComProvedorAction}>
          <input type="hidden" name="provider" value="discord" />
          <Button type="submit" variant="outline" className="w-full gap-2">
            <Image src={discordIcon} alt="" width={20} height={20} className="rounded-sm" />
            {t("continuarDiscord")}
          </Button>
        </form>
        <form action={entrarComProvedorAction}>
          <input type="hidden" name="provider" value="google" />
          <Button type="submit" variant="outline" className="w-full gap-2">
            <Image src={googleIcon} alt="" width={20} height={20} className="rounded-sm" />
            {t("continuarGoogle")}
          </Button>
        </form>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t("ou")}
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-6 flex rounded-lg border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setModo("entrar")}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            modo === "entrar" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          }`}
        >
          {t("entrar")}
        </button>
        <button
          type="button"
          onClick={() => setModo("cadastrar")}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            modo === "cadastrar" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          }`}
        >
          {t("cadastrar")}
        </button>
      </div>

      {modo === "entrar" ? <FormLogin /> : <FormCadastro />}
    </div>
  );
}

function FormLogin() {
  const t = useTranslations("Entrar");
  const [estado, formAction, pending] = useActionState(entrarComEmailAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("campoEmail")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">{t("campoSenha")}</Label>
        <Input id="senha" name="senha" type="password" required />
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("entrando") : t("entrar")}
      </Button>
    </form>
  );
}

function FormCadastro() {
  const t = useTranslations("Entrar");
  const [estado, formAction, pending] = useActionState(criarContaAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeExibicao">{t("campoNome")}</Label>
        <Input id="nomeExibicao" name="nomeExibicao" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">{t("campoUsername")}</Label>
        <Input id="username" name="username" required maxLength={30} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dataNascimento">{t("campoNascimento")}</Label>
        <Input id="dataNascimento" name="dataNascimento" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("campoEmail")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">{t("campoSenha")}</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} />
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
        {pending ? t("cadastrando") : t("cadastrar")}
      </Button>
    </form>
  );
}
