"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BannerUpload } from "@/components/site/banner-upload";
import { criarEventoAction, atualizarEventoAction } from "./actions";
import { MestrePicker, type MestreSelecionado } from "./mestre-picker";

export type TipoIngressoExistente = {
  id?: string;
  nome: string;
  descricao: string;
  precoReais: number;
  limiteMesas: number | null;
};

export type ApoiadorExistente = { nome: string; logoUrl: string; link: string };
export type AtracaoExistente = { horario: string; titulo: string; descricao: string };

export type EventoExistente = {
  titulo: string;
  subtitulo: string;
  descricao: string;
  cidadeUf: string;
  local: string;
  dataInicio: string;
  dataFim: string;
  horarioInicio: string;
  horarioFim: string;
  chavePix: string;
  whatsappConfirmacao: string;
  capacidadeMaxima: number | null;
  bannerUrl: string | null;
  tipos: TipoIngressoExistente[];
  imagens: string[];
  apoiadores: ApoiadorExistente[];
  atracoes: AtracaoExistente[];
  mestres: MestreSelecionado[];
};

const TIPO_VAZIO: TipoIngressoExistente = { nome: "", descricao: "", precoReais: 0, limiteMesas: null };
const APOIADOR_VAZIO: ApoiadorExistente = { nome: "", logoUrl: "", link: "" };
const ATRACAO_VAZIA: AtracaoExistente = { horario: "", titulo: "", descricao: "" };

export function EventoForm({
  eventoId,
  eventoExistente,
}: {
  eventoId?: string;
  eventoExistente?: EventoExistente;
}) {
  const editando = Boolean(eventoId && eventoExistente);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(eventoExistente?.bannerUrl ?? null);
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [tipos, setTipos] = useState<TipoIngressoExistente[]>(
    eventoExistente?.tipos && eventoExistente.tipos.length > 0 ? eventoExistente.tipos : [{ ...TIPO_VAZIO }],
  );
  const [imagens, setImagens] = useState<string[]>(eventoExistente?.imagens ?? []);
  const [apoiadores, setApoiadores] = useState<ApoiadorExistente[]>(eventoExistente?.apoiadores ?? []);
  const [atracoes, setAtracoes] = useState<AtracaoExistente[]>(eventoExistente?.atracoes ?? []);
  const [mestres, setMestres] = useState<MestreSelecionado[]>(eventoExistente?.mestres ?? []);

  function alterarTipo(i: number, campo: keyof TipoIngressoExistente, valor: string | number | null) {
    setTipos((atual) => atual.map((t, idx) => (idx === i ? { ...t, [campo]: valor } : t)));
  }

  function removerTipo(i: number) {
    setTipos((atual) => atual.filter((_, idx) => idx !== i));
  }

  function alterarApoiador(i: number, campo: keyof ApoiadorExistente, valor: string) {
    setApoiadores((atual) => atual.map((a, idx) => (idx === i ? { ...a, [campo]: valor } : a)));
  }

  function alterarAtracao(i: number, campo: keyof AtracaoExistente, valor: string) {
    setAtracoes((atual) => atual.map((a, idx) => (idx === i ? { ...a, [campo]: valor } : a)));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);

    const input = {
      titulo: formData.get("titulo"),
      subtitulo: formData.get("subtitulo") || undefined,
      descricao: formData.get("descricao"),
      cidadeUf: formData.get("cidadeUf"),
      local: formData.get("local") || undefined,
      dataInicio: formData.get("dataInicio"),
      dataFim: formData.get("dataFim") || undefined,
      horarioInicio: formData.get("horarioInicio") || undefined,
      horarioFim: formData.get("horarioFim") || undefined,
      chavePix: formData.get("chavePix") || undefined,
      whatsappConfirmacao: formData.get("whatsappConfirmacao") || undefined,
      capacidadeMaxima: formData.get("capacidadeMaxima") || undefined,
      bannerUrl,
      publicarAgora,
      tipos,
      imagens: imagens.map((url) => ({ url })),
      apoiadores: apoiadores
        .filter((a) => a.nome.trim() && a.logoUrl)
        .map((a) => ({ nome: a.nome, logoUrl: a.logoUrl, link: a.link || undefined })),
      atracoes: atracoes
        .filter((a) => a.titulo.trim())
        .map((a) => ({ horario: a.horario || undefined, titulo: a.titulo, descricao: a.descricao || undefined })),
      mestres: mestres.map((m) => ({ usuarioId: m.id })),
    };

    startTransition(async () => {
      const resultado = editando
        ? await atualizarEventoAction(eventoId!, input)
        : await criarEventoAction(input);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.push(`/admin/eventos/${editando ? eventoId : ""}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do evento</Label>
        <Input id="titulo" name="titulo" required maxLength={120} defaultValue={eventoExistente?.titulo} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitulo">Subtítulo</Label>
        <Input
          id="subtitulo"
          name="subtitulo"
          maxLength={160}
          placeholder="Uma frase curta que resume o evento"
          defaultValue={eventoExistente?.subtitulo}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          required
          maxLength={4000}
          rows={6}
          defaultValue={eventoExistente?.descricao}
        />
      </div>

      <div className="space-y-2">
        <Label>Imagem de capa</Label>
        <BannerUpload value={bannerUrl} onChange={setBannerUrl} bucket="event-banners" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cidadeUf">Cidade</Label>
          <Input
            id="cidadeUf"
            name="cidadeUf"
            required
            maxLength={80}
            placeholder="Belo Horizonte - MG"
            defaultValue={eventoExistente?.cidadeUf}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="local">Local</Label>
          <Input
            id="local"
            name="local"
            maxLength={160}
            placeholder="Endereço ou nome do espaço"
            defaultValue={eventoExistente?.local}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            required
            defaultValue={eventoExistente?.dataInicio}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data final (se durar mais de um dia)</Label>
          <Input id="dataFim" name="dataFim" type="date" defaultValue={eventoExistente?.dataFim} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioInicio">Horário de início</Label>
          <Input
            id="horarioInicio"
            name="horarioInicio"
            type="time"
            defaultValue={eventoExistente?.horarioInicio}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horarioFim">Horário de término</Label>
          <Input id="horarioFim" name="horarioFim" type="time" defaultValue={eventoExistente?.horarioFim} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacidadeMaxima">Vagas limitadas (opcional)</Label>
          <Input
            id="capacidadeMaxima"
            name="capacidadeMaxima"
            type="number"
            min={1}
            placeholder="Deixe em branco pra não limitar"
            defaultValue={eventoExistente?.capacidadeMaxima ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Confirmação de pagamento</p>
        <p className="text-xs text-muted-foreground">
          Mostrado pra quem escolher um ingresso — a chave Pix pra pagar e o WhatsApp pra mandar o
          comprovante. A aprovação continua manual, depois de você conferir.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chavePix">Chave Pix</Label>
            <Input id="chavePix" name="chavePix" maxLength={140} defaultValue={eventoExistente?.chavePix} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappConfirmacao">WhatsApp pra confirmação</Label>
            <Input
              id="whatsappConfirmacao"
              name="whatsappConfirmacao"
              maxLength={20}
              placeholder="31999999999"
              defaultValue={eventoExistente?.whatsappConfirmacao}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Tipos de ingresso</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTipos((atual) => [...atual, { ...TIPO_VAZIO }])}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar
          </Button>
        </div>

        {tipos.map((t, i) => (
          <div key={t.id ?? `novo-${i}`} className="space-y-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`tipo-nome-${i}`}>Ingresso {i + 1}</Label>
              {tipos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerTipo(i)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remover esse tipo de ingresso"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </div>
            <Input
              id={`tipo-nome-${i}`}
              placeholder="Nome do ingresso"
              maxLength={60}
              required
              value={t.nome}
              onChange={(e) => alterarTipo(i, "nome", e.target.value)}
            />
            <Textarea
              placeholder="O que inclui (opcional)"
              maxLength={300}
              rows={2}
              value={t.descricao}
              onChange={(e) => alterarTipo(i, "descricao", e.target.value)}
            />
            <div className="flex gap-3">
              <div className="max-w-[160px] space-y-1">
                <Label htmlFor={`tipo-preco-${i}`} className="text-xs text-muted-foreground">
                  Preço (R$)
                </Label>
                <Input
                  id={`tipo-preco-${i}`}
                  type="number"
                  min={0.01}
                  step="0.01"
                  required
                  value={t.precoReais || ""}
                  onChange={(e) => alterarTipo(i, "precoReais", Number(e.target.value))}
                />
              </div>
              <div className="max-w-[200px] space-y-1">
                <Label htmlFor={`tipo-limite-${i}`} className="text-xs text-muted-foreground">
                  Mesas inclusas (opcional)
                </Label>
                <Input
                  id={`tipo-limite-${i}`}
                  type="number"
                  min={1}
                  placeholder="Sem limite"
                  value={t.limiteMesas ?? ""}
                  onChange={(e) => alterarTipo(i, "limiteMesas", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Galeria de fotos</p>
        <p className="text-xs text-muted-foreground">Fotos extras pra mostrar o clima do evento.</p>
        <div className="flex flex-wrap gap-3">
          {imagens.map((url, i) => (
            <BannerUpload
              key={i}
              value={url}
              hideHint
              previewClassName="aspect-square w-28"
              onChange={(nova) =>
                setImagens((atual) => (nova ? atual.map((u, idx) => (idx === i ? nova : u)) : atual.filter((_, idx) => idx !== i)))
              }
              bucket="event-banners"
            />
          ))}
          <BannerUpload
            value={null}
            hideHint
            previewClassName="aspect-square w-28"
            onChange={(nova) => nova && setImagens((atual) => [...atual, nova])}
            bucket="event-banners"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Apoiadores</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setApoiadores((atual) => [...atual, { ...APOIADOR_VAZIO }])}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar
          </Button>
        </div>

        {apoiadores.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
            <BannerUpload
              value={a.logoUrl || null}
              hideHint
              previewClassName="aspect-square w-16"
              onChange={(nova) => alterarApoiador(i, "logoUrl", nova ?? "")}
              bucket="event-banners"
            />
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Nome do apoiador"
                maxLength={80}
                value={a.nome}
                onChange={(e) => alterarApoiador(i, "nome", e.target.value)}
              />
              <Input
                placeholder="Link (opcional)"
                maxLength={300}
                value={a.link}
                onChange={(e) => alterarApoiador(i, "link", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setApoiadores((atual) => atual.filter((_, idx) => idx !== i))}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Remover apoiador"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Programação / atrações</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAtracoes((atual) => [...atual, { ...ATRACAO_VAZIA }])}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar
          </Button>
        </div>

        {atracoes.map((a, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Horário (ex.: 14h)"
                  maxLength={40}
                  className="max-w-[140px]"
                  value={a.horario}
                  onChange={(e) => alterarAtracao(i, "horario", e.target.value)}
                />
                <Input
                  placeholder="Título da atração"
                  maxLength={120}
                  value={a.titulo}
                  onChange={(e) => alterarAtracao(i, "titulo", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setAtracoes((atual) => atual.filter((_, idx) => idx !== i))}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remover atração"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <Textarea
              placeholder="Descrição (opcional)"
              maxLength={300}
              rows={2}
              value={a.descricao}
              onChange={(e) => alterarAtracao(i, "descricao", e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Mestres confirmados</p>
        <p className="text-xs text-muted-foreground">Busca por nome ou usuário entre quem já tem conta no site.</p>
        <MestrePicker selecionados={mestres} onChange={setMestres} />
      </div>

      {!editando && (
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
      )}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (editando ? "Salvando..." : "Criando...") : editando ? "Salvar alterações" : "Criar evento"}
      </Button>
    </form>
  );
}
