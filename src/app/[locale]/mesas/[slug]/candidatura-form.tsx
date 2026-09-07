"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarCandidatura } from "./actions";

type Pergunta = {
  id: string;
  enunciado: string;
  tipo: string;
  obrigatoria: boolean;
};

export function CandidaturaForm({
  mesaId,
  slug,
  perguntas,
}: {
  mesaId: string;
  slug: string;
  perguntas: Pergunta[];
}) {
  const t = useTranslations("Mesas");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const respostas = perguntas.map((p) => ({
      perguntaId: p.id,
      resposta: String(formData.get(p.id) ?? ""),
    }));

    startTransition(async () => {
      const resultado = await criarCandidatura({ mesaId, slug, respostas });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setSucesso(true);
    });
  }

  if (sucesso) {
    return (
      <div className="rounded-xl border border-primary/40 bg-primary/[0.03] p-5">
        <p className="font-heading font-bold">{t("sucessoTitulo")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("sucessoCorpo")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {perguntas.map((pergunta) => (
        <div key={pergunta.id} className="space-y-2">
          <Label htmlFor={pergunta.id}>
            {pergunta.enunciado}
            {pergunta.obrigatoria && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea id={pergunta.id} name={pergunta.id} required={pergunta.obrigatoria} rows={3} />
        </div>
      ))}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("enviando") : t("enviar")}
      </Button>
    </form>
  );
}
