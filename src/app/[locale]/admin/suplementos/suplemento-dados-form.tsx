"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BannerUpload } from "@/components/site/banner-upload";
import { EditorMarkdown } from "@/components/site/editor-markdown";
import { CLASSIFICACAO_LABEL } from "@/lib/mesas/labels";
import { TIPOS_SUPLEMENTO, TIPO_SUPLEMENTO } from "@/lib/suplementos/labels";
import { atualizarSuplementoAction, criarSuplementoAction } from "./actions";

export type SuplementoDados = {
  titulo: string;
  resumo: string;
  descricaoMd: string;
  tipo: string;
  sistemaId: string | null;
  classificacao: string;
  capaUrl: string | null;
  usaIa: boolean;
  licencaBase: string;
  atribuicao: string;
};

export const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function SuplementoDadosForm({
  suplementoId,
  existente,
  sistemas,
}: {
  suplementoId?: string;
  existente?: SuplementoDados;
  sistemas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const editando = Boolean(suplementoId);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [capaUrl, setCapaUrl] = useState<string | null>(existente?.capaUrl ?? null);
  const [usaIa, setUsaIa] = useState(existente?.usaIa ?? false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSalvo(false);
    const f = new FormData(e.currentTarget);

    const input = {
      titulo: f.get("titulo"),
      resumo: f.get("resumo"),
      descricaoMd: f.get("descricaoMd") || undefined,
      tipo: f.get("tipo"),
      sistemaId: f.get("sistemaId") || null,
      classificacao: f.get("classificacao"),
      capaUrl,
      usaIa,
      licencaBase: f.get("licencaBase") || undefined,
      atribuicao: f.get("atribuicao") || undefined,
    };

    startTransition(async () => {
      if (editando) {
        const r = await atualizarSuplementoAction(suplementoId!, input);
        if (!r.ok) return setErro(r.error);
        setSalvo(true);
        router.refresh();
        return;
      }
      const r = await criarSuplementoAction(input);
      if (!r.ok) return setErro(r.error);
      router.push(`/admin/suplementos/${r.id}/editar`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required maxLength={120} defaultValue={existente?.titulo} />
        {!editando && (
          <p className="text-xs text-muted-foreground">
            O endereço da página é gerado a partir do título e não muda depois — escolha com calma.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumo">Resumo</Label>
        <Textarea
          id="resumo"
          name="resumo"
          required
          maxLength={300}
          rows={2}
          defaultValue={existente?.resumo}
          placeholder="Uma ou duas frases. Aparece no card do catálogo e na descrição do Google."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <select id="tipo" name="tipo" required defaultValue={existente?.tipo ?? "tabela_encontros"} className={CLASSE_SELECT}>
            {TIPOS_SUPLEMENTO.map((t) => (
              <option key={t} value={t}>
                {TIPO_SUPLEMENTO[t].rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sistemaId">Sistema</Label>
          <select id="sistemaId" name="sistemaId" defaultValue={existente?.sistemaId ?? ""} className={CLASSE_SELECT}>
            <option value="">Genérico (qualquer sistema)</option>
            {sistemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="classificacao">Classificação</Label>
          <select
            id="classificacao"
            name="classificacao"
            defaultValue={existente?.classificacao ?? "livre"}
            className={CLASSE_SELECT}
          >
            {(["livre", "14", "16", "18"] as const).map((c) => (
              <option key={c} value={c}>
                {CLASSIFICACAO_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Capa</Label>
        <BannerUpload
          value={capaUrl}
          onChange={setCapaUrl}
          bucket="suplemento-capas"
          previewClassName="aspect-video w-full max-w-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricaoMd">Descrição completa</Label>
        <EditorMarkdown name="descricaoMd" defaultValue={existente?.descricaoMd ?? ""} bucket="suplemento-capas" />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <Checkbox checked={usaIa} onCheckedChange={(v) => setUsaIa(Boolean(v))} className="mt-0.5" />
        <span>
          Usei IA pra produzir parte deste material
          <span className="block text-xs text-muted-foreground">
            Aparece na página do suplemento — é regra de transparência da especificação.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="licencaBase">Licença base (opcional)</Label>
          <Input
            id="licencaBase"
            name="licencaBase"
            maxLength={200}
            placeholder="Ex.: CC-BY-4.0 (SRD 5.1)"
            defaultValue={existente?.licencaBase}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="atribuicao">Atribuição (opcional)</Label>
          <Input
            id="atribuicao"
            name="atribuicao"
            maxLength={500}
            placeholder="Crédito exigido pela licença"
            defaultValue={existente?.atribuicao}
          />
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {salvo && <p className="text-sm text-emerald-400">Dados salvos.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : editando ? "Salvar dados" : "Criar e continuar"}
      </Button>
    </form>
  );
}
