"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BannerUpload } from "@/components/site/banner-upload";
import { EditorMarkdown } from "@/components/site/editor-markdown";
import type { Sistema } from "@/lib/mesas/types";
import { CIDADES_PRESENCIAIS, ehCidadePresencial } from "@/lib/mesas/cidades";
import { criarMesaDoMestre, atualizarMesaDoMestreAction } from "./actions";

export type MesaDoMestreExistente = {
  titulo: string;
  modalidade: "online" | "presencial";
  tipo: "one_shot" | "aventura" | "campanha";
  sistemaId: string;
  sistemaOutroNome: string | null;
  sinopse: string;
  cidadeUf: string | null;
  plataformaVtt: string | null;
  plataformaVoz: string | null;
  dataInicio: string;
  horarioInicio: string;
  horarioFim: string;
  vagasTotal: number;
  minJogadores: number;
  classificacao: string;
  nivelExperiencia: string;
  gratuita: boolean;
  valorReais: number | null;
  bannerUrl: string | null;
};

export function NovaMesaForm({
  sistemas,
  mesaId,
  mesaExistente,
  modalidadeInicial = "online",
}: {
  sistemas: Sistema[];
  mesaId?: string;
  mesaExistente?: MesaDoMestreExistente;
  /** Qual modalidade vem marcada ao abrir. /presencial/nova manda "presencial". */
  modalidadeInicial?: "online" | "presencial";
}) {
  const editando = Boolean(mesaId && mesaExistente);
  const t = useTranslations("PresencialBhNova");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [gratuita, setGratuita] = useState(mesaExistente?.gratuita ?? true);
  const [sistemaId, setSistemaId] = useState(mesaExistente?.sistemaId ?? "");
  const [sistemaOutroNome, setSistemaOutroNome] = useState(mesaExistente?.sistemaOutroNome ?? "");
  const [classificacao, setClassificacao] = useState(mesaExistente?.classificacao ?? "livre");
  const [nivelExperiencia, setNivelExperiencia] = useState(mesaExistente?.nivelExperiencia ?? "todos");
  const [bannerUrl, setBannerUrl] = useState<string | null>(mesaExistente?.bannerUrl ?? null);
  const [cidadeUf, setCidadeUf] = useState<string>(
    mesaExistente && ehCidadePresencial(mesaExistente.cidadeUf ?? "")
      ? mesaExistente.cidadeUf!
      : CIDADES_PRESENCIAIS[0],
  );
  const [modalidade, setModalidade] = useState<"online" | "presencial">(
    mesaExistente?.modalidade ?? modalidadeInicial,
  );
  const [tipo, setTipo] = useState<"one_shot" | "aventura" | "campanha">(
    mesaExistente?.tipo ?? "one_shot",
  );

  const ehOutro = sistemas.find((s) => s.id === sistemaId)?.slug === "outro";
  const ehPresencial = modalidade === "presencial";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const input = {
      titulo: formData.get("titulo"),
      modalidade,
      tipo,
      sistemaId,
      sistemaOutroNome: ehOutro ? sistemaOutroNome : undefined,
      sinopse: formData.get("sinopse"),
      cidadeUf: ehPresencial ? cidadeUf : undefined,
      plataformaVtt: ehPresencial ? undefined : (formData.get("plataformaVtt") as string) || undefined,
      plataformaVoz: ehPresencial ? undefined : (formData.get("plataformaVoz") as string) || undefined,
      dataInicio: formData.get("dataInicio"),
      horarioInicio: formData.get("horarioInicio"),
      horarioFim: formData.get("horarioFim"),
      vagasTotal: formData.get("vagasTotal"),
      minJogadores: formData.get("minJogadores"),
      classificacao,
      nivelExperiencia,
      gratuita,
      valorReais: formData.get("valorReais"),
      bannerUrl,
    };

    startTransition(async () => {
      const resultado = editando
        ? await atualizarMesaDoMestreAction(mesaId!, input)
        : await criarMesaDoMestre(input);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      // Volta pra listagem onde a mesa vai aparecer depois de aprovada —
      // mandar quem criou mesa online pra /presencial não faria sentido.
      router.push(ehPresencial ? "/presencial" : "/mesas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">{t("campoTitulo")}</Label>
        <Input id="titulo" name="titulo" required maxLength={120} defaultValue={mesaExistente?.titulo} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sistemaId">{t("campoSistema")}</Label>
        <Select value={sistemaId} onValueChange={(v) => v && setSistemaId(v)}>
          <SelectTrigger id="sistemaId" className="w-full">
            <SelectValue placeholder={t("campoSistemaPlaceholder")}>
              {(v: string) => sistemas.find((s) => s.id === v)?.nome ?? t("campoSistemaPlaceholder")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sistemas.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ehOutro && (
          <Input
            id="sistemaOutroNome"
            name="sistemaOutroNome"
            placeholder={t("campoSistemaOutro")}
            required
            maxLength={60}
            value={sistemaOutroNome}
            onChange={(e) => setSistemaOutroNome(e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sinopse">{t("campoSinopse")}</Label>
        <EditorMarkdown name="sinopse" defaultValue={mesaExistente?.sinopse ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Imagem de capa</Label>
        <BannerUpload value={bannerUrl} onChange={setBannerUrl} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="modalidade">{t("campoModalidade")}</Label>
          <Select
            value={modalidade}
            onValueChange={(v) => v && setModalidade(v as "online" | "presencial")}
          >
            <SelectTrigger id="modalidade" className="w-full">
              <SelectValue>
                {(v: string) => (v === "presencial" ? t("modalidadePresencial") : t("modalidadeOnline"))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">{t("modalidadeOnline")}</SelectItem>
              <SelectItem value="presencial">{t("modalidadePresencial")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">{t("campoTipo")}</Label>
          <Select
            value={tipo}
            onValueChange={(v) => v && setTipo(v as "one_shot" | "aventura" | "campanha")}
          >
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue>
                {(v: string) =>
                  v === "campanha" ? t("tipoCampanha") : v === "aventura" ? t("tipoAventura") : t("tipoOneShot")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_shot">{t("tipoOneShot")}</SelectItem>
              <SelectItem value="aventura">{t("tipoAventura")}</SelectItem>
              <SelectItem value="campanha">{t("tipoCampanha")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {ehPresencial ? (
        <div className="space-y-2">
          <Label htmlFor="cidadeUf">{t("campoCidade")}</Label>
          {/* Lista fechada: a listagem filtra por ela, então cidade digitada à
              mão sumiria da página sem explicação. */}
          <Select value={cidadeUf} onValueChange={(v) => v && setCidadeUf(v)}>
            <SelectTrigger id="cidadeUf" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIDADES_PRESENCIAIS.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  {cidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{t("campoCidadeAjuda")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plataformaVtt">{t("campoVtt")}</Label>
            <Input
              id="plataformaVtt"
              name="plataformaVtt"
              maxLength={60}
              placeholder={t("campoVttPlaceholder")}
              defaultValue={mesaExistente?.plataformaVtt ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plataformaVoz">{t("campoVoz")}</Label>
            <Input
              id="plataformaVoz"
              name="plataformaVoz"
              maxLength={60}
              placeholder={t("campoVozPlaceholder")}
              defaultValue={mesaExistente?.plataformaVoz ?? ""}
            />
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">{t("campoPlataformaAjuda")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">{t("campoData")}</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
            defaultValue={mesaExistente?.dataInicio}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioInicio">{t("campoHorarioInicio")}</Label>
          <Input
            id="horarioInicio"
            name="horarioInicio"
            type="time"
            required
            defaultValue={mesaExistente?.horarioInicio}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioFim">{t("campoHorarioFim")}</Label>
          <Input
            id="horarioFim"
            name="horarioFim"
            type="time"
            required
            defaultValue={mesaExistente?.horarioFim}
          />
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
            defaultValue={mesaExistente?.vagasTotal ?? 5}
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
            defaultValue={mesaExistente?.minJogadores ?? 3}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="classificacao">{t("campoClassificacao")}</Label>
          <Select value={classificacao} onValueChange={(v) => v && setClassificacao(v)}>
            <SelectTrigger id="classificacao" className="w-full">
              <SelectValue>
                {(v: string) =>
                  ({ livre: t("classLivre"), "14": t("class14"), "16": t("class16"), "18": t("class18") })[v] ?? v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="livre">{t("classLivre")}</SelectItem>
              <SelectItem value="14">{t("class14")}</SelectItem>
              <SelectItem value="16">{t("class16")}</SelectItem>
              <SelectItem value="18">{t("class18")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivelExperiencia">{t("campoNivel")}</Label>
          <Select value={nivelExperiencia} onValueChange={(v) => v && setNivelExperiencia(v)}>
            <SelectTrigger id="nivelExperiencia" className="w-full">
              <SelectValue>
                {(v: string) =>
                  ({
                    todos: t("nivelTodos"),
                    iniciante: t("nivelIniciante"),
                    intermediario: t("nivelIntermediario"),
                    avancado: t("nivelAvancado"),
                  })[v] ?? v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{t("nivelTodos")}</SelectItem>
              <SelectItem value="iniciante">{t("nivelIniciante")}</SelectItem>
              <SelectItem value="intermediario">{t("nivelIntermediario")}</SelectItem>
              <SelectItem value="avancado">{t("nivelAvancado")}</SelectItem>
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
              defaultValue={mesaExistente?.valorReais ?? undefined}
            />
            <p className="text-xs text-muted-foreground">{t("campoValorAjuda")}</p>
          </div>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("enviando") : editando ? "Salvar alterações" : t("enviar")}
      </Button>
    </form>
  );
}
