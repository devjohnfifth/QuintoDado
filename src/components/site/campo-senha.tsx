"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Campo de senha com botão de mostrar/esconder — evita erro de digitação no celular. */
export function CampoSenha(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  const t = useTranslations("Entrar");
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visivel ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? t("esconderSenha") : t("mostrarSenha")}
        aria-pressed={visivel}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground"
      >
        {visivel ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
