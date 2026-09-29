"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { Selo } from "@/components/site/selo";
import { DescricaoMarkdown } from "@/components/site/descricao-markdown";
import { EditorMarkdown } from "@/components/site/editor-markdown";
import type { Sessao } from "@/lib/painel/dados";
import {
  apagarSessaoAction,
  criarSessaoAction,
  publicarSessaoAction,
  salvarSessaoAction,
} from "../actions";

export function Sessoes({ slug, sessoes, ehMestre }: { slug: string; sessoes: Sessao[]; ehMestre: boolean }) {
  const t = useTranslations("Painel");
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function criar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarSessaoAction(slug);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {ehMestre && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="marca" onClick={criar} disabled={pendente}>
            {pendente ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" aria-hidden />}
            {t("novaSessao")}
          </Button>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
      )}

      {sessoes.length === 0 ? (
        <EstadoVazio
          icone={CalendarDays}
          titulo={ehMestre ? t("sessoesVazioMestre") : t("sessoesVazioJogador")}
          corpo={ehMestre ? t("sessoesVazioMestreCorpo") : t("sessoesVazioJogadorCorpo")}
        />
      ) : (
        <ol className="space-y-4">
          {sessoes.map((sessao) => (
            <li key={sessao.id}>
              <CartaoSessao slug={slug} sessao={sessao} ehMestre={ehMestre} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CartaoSessao({ slug, sessao, ehMestre }: { slug: string; sessao: Sessao; ehMestre: boolean }) {
  const t = useTranslations("Painel");
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [data, setData] = useState(sessao.data ?? "");
  const [resumo, setResumo] = useState(sessao.resumo_md ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarSessaoAction(slug, sessao.id, { data, resumoMd: resumo });
      if (!r.ok) return setErro(r.error);
      setEditando(false);
      router.refresh();
    });
  }

  function publicar() {
    setErro(null);
    startTransition(async () => {
      const r = await publicarSessaoAction(slug, sessao.id, !sessao.publicado);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  function apagar() {
    setErro(null);
    startTransition(async () => {
      const r = await apagarSessaoAction(slug, sessao.id);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  // Rascunho é conteúdo que só o mestre vê: mesma convenção do elenco.
  const borda = ehMestre && !sessao.publicado ? "border-dashed border-erro/60" : "border-border";

  return (
    <article className={`rounded-2xl border bg-card/60 p-5 ${borda}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-lg font-bold">{t("sessaoNumero", { n: sessao.numero })}</h2>
        {sessao.data && !editando && (
          <span className="text-sm text-muted-foreground">
            {new Date(`${sessao.data}T00:00:00`).toLocaleDateString("pt-BR")}
          </span>
        )}
        {ehMestre && !sessao.publicado && (
          <Selo tom="erro" className="border border-dashed border-erro/60 bg-transparent">
            {t("rascunho")}
          </Selo>
        )}

        {ehMestre && !editando && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditando(true)} disabled={pendente}>
              {t("editar")}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={publicar} disabled={pendente}>
              {sessao.publicado ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {sessao.publicado ? t("despublicar") : t("publicar")}
            </Button>
            {confirmando ? (
              <Button variant="destructive" size="sm" className="rounded-full" onClick={apagar} disabled={pendente}>
                {pendente ? <Loader2 className="size-4 animate-spin" /> : t("confirmarExcluir")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("excluir")}
                onClick={() => setConfirmando(true)}
                disabled={pendente}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        )}
      </div>

      {editando ? (
        <div className="mt-4 space-y-4">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor={`data-${sessao.id}`}>{t("sessaoData")}</Label>
            <Input id={`data-${sessao.id}`} type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("sessaoResumo")}</Label>
            <EditorMarkdown name={`resumo-${sessao.id}`} defaultValue={resumo} aoMudar={setResumo} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="marca" onClick={salvar} disabled={pendente}>
              {pendente ? <Loader2 className="size-4 animate-spin" /> : t("salvar")}
            </Button>
            <Button variant="ghost" onClick={() => setEditando(false)} disabled={pendente}>
              {t("cancelar")}
            </Button>
          </div>
        </div>
      ) : (
        sessao.resumo_md && (
          <div className="mt-3">
            <DescricaoMarkdown texto={sessao.resumo_md} />
          </div>
        )
      )}

      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
    </article>
  );
}
