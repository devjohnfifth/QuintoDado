"use client";

import { useState, useTransition } from "react";
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
import { BannerUpload } from "@/components/site/banner-upload";
import type { Sistema } from "@/lib/mesas/types";
import { criarMesaAdmin } from "../actions";

const TIPO_LABEL: Record<string, string> = {
  one_shot: "One-shot",
  aventura: "Aventura fechada",
  campanha: "Campanha",
};

const FREQUENCIA_LABEL: Record<string, string> = {
  unica: "Sessão única (one-shot)",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

const CLASSIFICACAO_LABEL: Record<string, string> = {
  livre: "Livre",
  "14": "+14 anos",
  "16": "+16 anos",
  "18": "+18 anos",
};

const NIVEL_LABEL: Record<string, string> = {
  todos: "Todos",
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export function NovaMesaAdminForm({ sistemas }: { sistemas: Sistema[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sistemaId, setSistemaId] = useState("");
  const [sistemaOutroNome, setSistemaOutroNome] = useState("");
  const [tipo, setTipo] = useState("one_shot");
  const [modalidade, setModalidade] = useState<"online" | "presencial">("online");
  const [frequencia, setFrequencia] = useState("unica");
  const [classificacao, setClassificacao] = useState("livre");
  const [nivelExperiencia, setNivelExperiencia] = useState("todos");
  const [gratuita, setGratuita] = useState(false);
  const [cobrancaGerenciadaPeloSite, setCobrancaGerenciadaPeloSite] = useState(true);
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const ehOutro = sistemas.find((s) => s.id === sistemaId)?.slug === "outro";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const input = {
      titulo: formData.get("titulo"),
      sistemaId,
      sistemaOutroNome: ehOutro ? sistemaOutroNome : undefined,
      sinopse: formData.get("sinopse"),
      tipo,
      modalidade,
      cidadeUf: formData.get("cidadeUf") || undefined,
      plataformaVtt: formData.get("plataformaVtt") || undefined,
      plataformaVoz: formData.get("plataformaVoz") || undefined,
      frequencia,
      qtdSessoes: formData.get("qtdSessoes") || undefined,
      dataInicio: formData.get("dataInicio"),
      horarioInicio: formData.get("horarioInicio"),
      horarioFim: formData.get("horarioFim"),
      vagasTotal: formData.get("vagasTotal"),
      minJogadores: formData.get("minJogadores"),
      classificacao,
      nivelExperiencia,
      gratuita,
      valorReais: formData.get("valorReais"),
      cobrancaGerenciadaPeloSite,
      publicarAgora,
      bannerUrl,
    };

    startTransition(async () => {
      const resultado = await criarMesaAdmin(input);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.push("/admin/mesas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título da mesa</Label>
        <Input id="titulo" name="titulo" required maxLength={120} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sistemaId">Sistema</Label>
          <Select value={sistemaId} onValueChange={(v) => v && setSistemaId(v)}>
            <SelectTrigger id="sistemaId" className="w-full">
              <SelectValue placeholder="Escolha um sistema">
                {(v: string) => sistemas.find((s) => s.id === v)?.nome ?? "Escolha um sistema"}
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
              placeholder="Qual sistema?"
              required
              maxLength={60}
              value={sistemaOutroNome}
              onChange={(e) => setSistemaOutroNome(e.target.value)}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            value={tipo}
            onValueChange={(v) => {
              if (!v) return;
              setTipo(v);
              if (v === "one_shot") setFrequencia("unica");
            }}
          >
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue>{(v: string) => TIPO_LABEL[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_shot">One-shot</SelectItem>
              <SelectItem value="aventura">Aventura fechada</SelectItem>
              <SelectItem value="campanha">Campanha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sinopse">Sinopse</Label>
        <Textarea id="sinopse" name="sinopse" required maxLength={2000} rows={4} />
      </div>

      <div className="space-y-2">
        <Label>Imagem de capa</Label>
        <BannerUpload value={bannerUrl} onChange={setBannerUrl} />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="modalidadePresencial"
            checked={modalidade === "presencial"}
            onCheckedChange={(v) => setModalidade(v === true ? "presencial" : "online")}
          />
          <Label htmlFor="modalidadePresencial" className="font-normal">
            Mesa presencial
          </Label>
        </div>

        {modalidade === "presencial" ? (
          <div className="space-y-2">
            <Label htmlFor="cidadeUf">Cidade</Label>
            <Input id="cidadeUf" name="cidadeUf" maxLength={80} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plataformaVtt">Plataforma de VTT</Label>
              <Input id="plataformaVtt" name="plataformaVtt" placeholder="Foundry VTT" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plataformaVoz">Plataforma de voz</Label>
              <Input id="plataformaVoz" name="plataformaVoz" placeholder="Discord" maxLength={80} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioInicio">Início</Label>
          <Input id="horarioInicio" name="horarioInicio" type="time" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioFim">Término</Label>
          <Input id="horarioFim" name="horarioFim" type="time" required />
        </div>
      </div>

      {tipo !== "one_shot" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="frequencia">Frequência</Label>
            <Select value={frequencia} onValueChange={(v) => v && setFrequencia(v)}>
              <SelectTrigger id="frequencia" className="w-full">
                <SelectValue>{(v: string) => FREQUENCIA_LABEL[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unica">Sessão única (one-shot)</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequencia !== "unica" && (
            <div className="space-y-2">
              <Label htmlFor="qtdSessoes">Nº de sessões previstas</Label>
              <Input id="qtdSessoes" name="qtdSessoes" type="number" min={1} max={999} placeholder="Deixe em branco se for campanha aberta" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vagasTotal">Vagas totais</Label>
          <Input id="vagasTotal" name="vagasTotal" type="number" min={1} max={12} defaultValue={5} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minJogadores">Mínimo de jogadores</Label>
          <Input id="minJogadores" name="minJogadores" type="number" min={1} defaultValue={3} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="classificacao">Classificação etária</Label>
          <Select value={classificacao} onValueChange={(v) => v && setClassificacao(v)}>
            <SelectTrigger id="classificacao" className="w-full">
              <SelectValue>{(v: string) => CLASSIFICACAO_LABEL[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="livre">Livre</SelectItem>
              <SelectItem value="14">+14 anos</SelectItem>
              <SelectItem value="16">+16 anos</SelectItem>
              <SelectItem value="18">+18 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivelExperiencia">Nível de experiência</Label>
          <Select value={nivelExperiencia} onValueChange={(v) => v && setNivelExperiencia(v)}>
            <SelectTrigger id="nivelExperiencia" className="w-full">
              <SelectValue>{(v: string) => NIVEL_LABEL[v] ?? v}</SelectValue>
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
          <Checkbox id="gratuita" checked={gratuita} onCheckedChange={(v) => setGratuita(v === true)} />
          <Label htmlFor="gratuita" className="font-normal">
            Mesa gratuita
          </Label>
        </div>

        {!gratuita && (
          <>
            <div className="space-y-2">
              <Label htmlFor="valorReais">Valor (R$)</Label>
              <Input id="valorReais" name="valorReais" type="number" min={5} max={9999} step="0.01" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cobrancaGerenciadaPeloSite"
                checked={cobrancaGerenciadaPeloSite}
                onCheckedChange={(v) => setCobrancaGerenciadaPeloSite(v === true)}
              />
              <Label htmlFor="cobrancaGerenciadaPeloSite" className="font-normal text-sm">
                Cobrança processada pelo site (Pix) — desmarque se o valor é só combinado por fora
              </Label>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="publicarAgora"
          checked={publicarAgora}
          onCheckedChange={(v) => setPublicarAgora(v === true)}
        />
        <Label htmlFor="publicarAgora" className="font-normal">
          Publicar agora (senão fica como rascunho)
        </Label>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Criando..." : "Criar mesa"}
      </Button>
    </form>
  );
}
