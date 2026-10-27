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

export function Sessoes({
  slug,
  sessoes,
  ehMestre,
  usuarioId,
}: {
  slug: string;
  sessoes: Sessao[];
  ehMestre: boolean;
  usuarioId: string;
}) {
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="marca" onClick={criar} disabled={pendente}>
          {pendente ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" aria-hidden />}
          {ehMestre ? t("novaSessao") : t("novoResumo")}
        </Button>
        {!ehMestre && <p className="text-sm text-muted-foreground">{t("avisoJogador")}</p>}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>

      {sessoes.length === 0 ? (
        <EstadoVazio
          icone={CalendarDays}
          titulo={ehMestre ? t("sessoesVazioMestre") : t("sessoesVazioJogador")}
          corpo={ehMestre ? t("sessoesVazioMestreCorpo") : t("sessoesVazioJogadorCorpo")}
        />
      ) : (
        // Linha do tempo: uma campanha é uma sequência, e a lista plana não
        // mostrava isso. O número sai do cabeçalho do card e vira o marco.
        <ol className="relative space-y-4 border-l border-border/60 pl-7 sm:pl-9">
          {sessoes.map((sessao) => (
            <li key={sessao.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[2.2rem] top-5 flex size-7 items-center justify-center rounded-full border border-primary/50 bg-background font-heading text-xs font-bold tabular-nums text-primary sm:-left-[2.7rem]"
              >
                {sessao.numero}
              </span>
              <CartaoSessao slug={slug} sessao={sessao} ehMestre={ehMestre} usuarioId={usuarioId} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CartaoSessao({
  slug,
  sessao,
  ehMestre,
  usuarioId,
}: {
  slug: string;
  sessao: Sessao;
  ehMestre: boolean;
  usuarioId: string;
}) {
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

  // Rascunho é conteúdo que só o mestre vê: mesma convenção do elenco —
  // fio de cor na lateral em vez de borda tracejada.
  const corFio = ehMestre && !sessao.publicado ? "bg-erro/70" : "bg-sucesso/60";
  // Cada um edita o próprio registro; o mestre edita qualquer um.
  const meu = sessao.criado_por === usuarioId;
  const podeEditar = ehMestre || meu;
  const autor = sessao.criado_por && !meu ? sessao.profiles?.nome_exibicao : null;

  return (
    <article className="relative overflow-hidden rounded-2xl painel p-5 pl-6">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${corFio}`} />

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="titulo-display titulo-bloco">{t("sessaoNumero", { n: sessao.numero })}</h2>
          {sessao.data && !editando && (
            <p className="mt-0.5 text-sm text-muted-foreground first-letter:uppercase">
              {new Date(`${sessao.data}T00:00:00`).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ehMestre && !sessao.publicado && (
              <Selo tom="erro" className="border border-dashed border-erro/60 bg-transparent">
                {t("rascunho")}
              </Selo>
            )}
            {autor && <Selo tom="neutro">{t("resumoDe", { nome: autor })}</Selo>}
            {meu && sessao.criado_por && <Selo tom="neutro">{t("criadoPorVoce")}</Selo>}
          </div>
        </div>

        {podeEditar && !editando && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => setEditando(true)} disabled={pendente}>
              {t("editar")}
            </Button>
            {/* Publicar é decisão de quem mestra; relato de jogador já nasce publicado. */}
            {ehMestre && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={publicar} disabled={pendente}>
                {sessao.publicado ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                {sessao.publicado ? t("despublicar") : t("publicar")}
              </Button>
            )}
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
