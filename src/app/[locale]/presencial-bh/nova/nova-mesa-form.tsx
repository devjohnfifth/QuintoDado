"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarMesaPresencial } from "./actions";

type Sistema = { id: string; nome: string };

export function NovaMesaForm({ sistemas }: { sistemas: Sistema[] }) {
  const t = useTranslations("PresencialBhNova");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [gratuita, setGratuita] = useState(true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const input = {
      titulo: formData.get("titulo"),
      sistemaId: formData.get("sistemaId"),
      sinopse: formData.get("sinopse"),
      cidadeUf: formData.get("cidadeUf"),
      dataInicio: formData.get("dataInicio"),
      horarioInicio: formData.get("horarioInicio"),
      horarioFim: formData.get("horarioFim"),
      vagasTotal: formData.get("vagasTotal"),
      minJogadores: formData.get("minJogadores"),
      classificacao: formData.get("classificacao"),
      nivelExperiencia: formData.get("nivelExperiencia"),
      gratuita,
      valorReais: formData.get("valorReais"),
    };

    startTransition(async () => {
      const resultado = await criarMesaPresencial(input);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.push("/presencial-bh");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">{t("campoTitulo")}</Label>
        <Input id="titulo" name="titulo" required maxLength={120} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sistemaId">{t("campoSistema")}</Label>
        <Select name="sistemaId" required>
          <SelectTrigger id="sistemaId" className="w-full">
            <SelectValue placeholder="Escolha um sistema" />
          </SelectTrigger>
          <SelectContent>
            {sistemas.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sinopse">{t("campoSinopse")}</Label>
        <Textarea id="sinopse" name="sinopse" required maxLength={2000} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cidadeUf">{t("campoCidade")}</Label>
        <Input
          id="cidadeUf"
          name="cidadeUf"
          required
          defaultValue="Belo Horizonte - MG"
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">{t("campoData")}</Label>
          <Input id="dataInicio" name="dataInicio" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioInicio">{t("campoHorarioInicio")}</Label>
          <Input id="horarioInicio" name="horarioInicio" type="time" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioFim">{t("campoHorarioFim")}</Label>
          <Input id="horarioFim" name="horarioFim" type="time" required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vagasTotal">{t("campoVagas")}</Label>
          <Input
            id="vagasTotal"
            name="vagasTotal"
            type="number"
            min={1}
            max={12}
            defaultValue={5}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minJogadores">{t("campoMinJogadores")}</Label>
          <Input
            id="minJogadores"
            name="minJogadores"
            type="number"
            min={1}
            defaultValue={3}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="classificacao">{t("campoClassificacao")}</Label>
          <Select name="classificacao" defaultValue="livre" required>
            <SelectTrigger id="classificacao" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="livre">Livre</SelectItem>
              <SelectItem value="14">14 anos</SelectItem>
              <SelectItem value="16">16 anos</SelectItem>
              <SelectItem value="18">18 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivelExperiencia">{t("campoNivel")}</Label>
          <Select name="nivelExperiencia" defaultValue="todos" required>
            <SelectTrigger id="nivelExperiencia" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="iniciante">Iniciante</SelectItem>
              <SelectItem value="intermediario">Intermediário</SelectItem>
              <SelectItem value="avancado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="gratuita"
            checked={gratuita}
            onCheckedChange={(v) => setGratuita(v === true)}
          />
          <Label htmlFor="gratuita" className="font-normal">
            {t("campoGratuita")}
          </Label>
        </div>

        {!gratuita && (
          <div className="space-y-2">
            <Label htmlFor="valorReais">{t("campoValor")}</Label>
            <Input
              id="valorReais"
              name="valorReais"
              type="number"
              min={5}
              max={999}
              step="0.01"
              placeholder="20,00"
            />
            <p className="text-xs text-muted-foreground">{t("campoValorAjuda")}</p>
          </div>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("enviando") : t("enviar")}
      </Button>
    </form>
  );
}
