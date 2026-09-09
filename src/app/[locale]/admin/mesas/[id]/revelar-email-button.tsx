"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { buscarEmailCandidatoAction } from "./actions";

export function RevelarEmailButton({ usuarioId }: { usuarioId: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (email) {
    return (
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Mail className="size-3" aria-hidden />
        {email}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => setEmail(await buscarEmailCandidatoAction(usuarioId)))}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <Mail className="size-3" aria-hidden />
      {pending ? "Buscando..." : "Ver e-mail"}
    </button>
  );
}
