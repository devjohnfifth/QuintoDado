"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenhaComCodigoAction } from "./actions";

export function RedefinirSenhaCodigoForm() {
  const [estado, formAction, pending] = useActionState(redefinirSenhaComCodigoAction, null);

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl border border-dashed border-border p-5">
      <p className="text-sm text-muted-foreground">
        O link não abriu a troca direto? Digita o código que também veio no mesmo e-mail de
        recuperação.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-codigo">E-mail</Label>
          <Input id="email-codigo" name="email" type="email" required autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor="codigo">Código do e-mail</Label>
          <Input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha-codigo">Nova senha</Label>
          <Input id="senha-codigo" name="senha" type="password" required minLength={8} />
        </div>
        {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Salvando..." : "Trocar senha com o código"}
        </Button>
      </form>
    </div>
  );
}
