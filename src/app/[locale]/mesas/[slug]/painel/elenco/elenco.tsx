"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Eye, EyeOff, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { Selo } from "@/components/site/selo";
import {
  CLASSE_VISIBILIDADE,
  TIPOS_ENTIDADE,
  TIPO_ENTIDADE_LABEL,
  type Campo,
  type Entidade,
  type TipoEntidade,
  type Visibilidade,
} from "@/lib/painel/tipos";
import {
  alternarEntidadeAction,
  apagarCampoAction,
  apagarEntidadeAction,
  criarEntidadeAction,
  salvarCampoAction,
} from "../actions";

type Membro = { id: string; nome: string };

const CLASSE_SELECT =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";

export function Elenco({
  slug,
  entidades,
  membros,
  ehMestre,
  usuarioId,
}: {
  slug: string;
  entidades: Entidade[];
  membros: Membro[];
  ehMestre: boolean;
  usuarioId: string;
}) {
  const t = useTranslations("Painel");
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoEntidade>("npc");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function criar() {
    setErro(null);
    startTransition(async () => {
      const r = await criarEntidadeAction(slug, { tipo, nome });
      if (!r.ok) return setErro(r.error);
      setNome("");
      setCriando(false);
      router.refresh();
    });
  }

  const grupos = TIPOS_ENTIDADE.map((tp) => ({
    tipo: tp,
    itens: entidades.filter((e) => e.tipo === tp),
  })).filter((g) => g.itens.length > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
          {criando ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="nome-entidade">{t("nome")}</Label>
                <Input
                  id="nome-entidade"
                  value={nome}
                  autoFocus
                  maxLength={120}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo-entidade">{t("tipo")}</Label>
                <select
                  id="tipo-entidade"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoEntidade)}
                  className={CLASSE_SELECT}
                >
                  {TIPOS_ENTIDADE.map((tp) => (
                    <option key={tp} value={tp}>
                      {TIPO_ENTIDADE_LABEL[tp].singular}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="marca" onClick={criar} disabled={pendente || nome.trim().length === 0}>
                  {pendente ? <Loader2 className="size-4 animate-spin" /> : t("criar")}
                </Button>
                <Button variant="ghost" onClick={() => setCriando(false)} disabled={pendente}>
                  {t("cancelar")}
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setCriando(true)} className={buttonVariants({ variant: "marca" })}>
              <Plus className="size-4" aria-hidden />
              {t("novaFicha")}
            </button>
          )}
        {!ehMestre && <p className="mt-2 text-sm text-muted-foreground">{t("avisoJogador")}</p>}
        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
      </div>

      {grupos.length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo={ehMestre ? t("elencoVazioMestre") : t("elencoVazioJogador")}
          corpo={ehMestre ? t("elencoVazioMestreCorpo") : t("elencoVazioJogadorCorpo")}
        />
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.tipo}>
            <h2 className="font-heading text-lg font-bold">{TIPO_ENTIDADE_LABEL[grupo.tipo].plural}</h2>
            <ul className="mt-3 space-y-3">
              {grupo.itens.map((entidade) => (
                <li key={entidade.id}>
                  <FichaEntidade
                    slug={slug}
                    entidade={entidade}
                    membros={membros}
                    ehMestre={ehMestre}
                    usuarioId={usuarioId}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FichaEntidade({
  slug,
  entidade,
  membros,
  ehMestre,
  usuarioId,
}: {
  slug: string;
  entidade: Entidade;
  membros: Membro[];
  ehMestre: boolean;
  usuarioId: string;
}) {
  const t = useTranslations("Painel");
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [novoCampo, setNovoCampo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function alternar() {
    setErro(null);
    startTransition(async () => {
      const r = await alternarEntidadeAction(slug, entidade.id, !entidade.oculta);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  function apagar() {
    setErro(null);
    startTransition(async () => {
      const r = await apagarEntidadeAction(slug, entidade.id);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  // Vermelho tracejado quando só o mestre vê: a mesma convenção do campo.
  const borda = ehMestre && entidade.oculta ? "border-dashed border-erro/60" : "border-border";
  // Jogador mexe só no que é dele; o mestre mexe em tudo.
  const minha = entidade.criado_por === usuarioId;
  const podeEditar = ehMestre || minha;

  return (
    <div className={`rounded-2xl border bg-card/60 ${borda}`}>
      <div className="flex flex-wrap items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          aria-expanded={aberta}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={`size-4 shrink-0 transition-transform ${aberta ? "rotate-180" : ""}`} aria-hidden />
          <span className="truncate font-heading font-bold">{entidade.nome}</span>
        </button>

        {entidade.criado_por && (
          <Selo tom="neutro">
            {minha ? t("criadoPorVoce") : t("criadoPor", { nome: entidade.profiles?.nome_exibicao ?? "?" })}
          </Selo>
        )}

        {!ehMestre &&
          minha &&
          (confirmando ? (
            <Button variant="destructive" size="sm" onClick={apagar} disabled={pendente} className="rounded-full">
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
          ))}

        {ehMestre && (
          <>
            <Selo tom={entidade.oculta ? "erro" : "sucesso"} className={CLASSE_VISIBILIDADE[entidade.oculta ? "oculto" : "mesa"]}>
              {entidade.oculta ? t("seloOculto") : t("seloMesa")}
            </Selo>
            <Button variant="outline" size="sm" onClick={alternar} disabled={pendente} className="rounded-full">
              {entidade.oculta ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
              {entidade.oculta ? t("revelar") : t("ocultar")}
            </Button>
            {confirmando ? (
              <Button variant="destructive" size="sm" onClick={apagar} disabled={pendente} className="rounded-full">
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
          </>
        )}
      </div>

      {aberta && (
        <div className="space-y-3 border-t border-border/60 p-4">
          {entidade.painel_campos.length === 0 && !novoCampo && (
            <p className="text-sm text-muted-foreground">{t("semCampos")}</p>
          )}

          {entidade.painel_campos.map((campo) => (
            <CampoFicha
              key={campo.id}
              slug={slug}
              entidadeId={entidade.id}
              campo={campo}
              membros={membros}
              ehMestre={ehMestre}
              podeEditar={podeEditar}
            />
          ))}

          {podeEditar &&
            (novoCampo ? (
              <CampoFicha
                slug={slug}
                entidadeId={entidade.id}
                membros={membros}
                ehMestre={ehMestre}
                podeEditar
                aoFechar={() => setNovoCampo(false)}
              />
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setNovoCampo(true)}>
                <Plus className="size-4" aria-hidden />
                {t("novoCampo")}
              </Button>
            ))}

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
      )}
    </div>
  );
}

function CampoFicha({
  slug,
  entidadeId,
  campo,
  membros,
  ehMestre,
  podeEditar,
  aoFechar,
}: {
  slug: string;
  entidadeId: string;
  campo?: Campo;
  membros: Membro[];
  /** Mestre escolhe quem vê cada campo; jogador escreve sempre pra mesa toda. */
  ehMestre: boolean;
  podeEditar: boolean;
  aoFechar?: () => void;
}) {
  const t = useTranslations("Painel");
  const router = useRouter();
  const [editando, setEditando] = useState(!campo);
  const [rotulo, setRotulo] = useState(campo?.rotulo ?? "");
  const [valor, setValor] = useState(campo?.valor ?? "");
  const [vis, setVis] = useState<Visibilidade>(campo?.vis ?? "oculto");
  const [reveladoPara, setReveladoPara] = useState<string[]>(campo?.revelado_para ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await salvarCampoAction(slug, campo?.id ?? null, { entidadeId, rotulo, valor, vis, reveladoPara });
      if (!r.ok) return setErro(r.error);
      setEditando(false);
      aoFechar?.();
      router.refresh();
    });
  }

  function apagar() {
    if (!campo) return;
    setErro(null);
    startTransition(async () => {
      const r = await apagarCampoAction(slug, campo.id);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  if (!podeEditar || !editando) {
    // Leitura. Pro jogador não existe estado "oculto": o RLS não manda o campo.
    return (
      <div className={`rounded-xl p-3 ${ehMestre ? CLASSE_VISIBILIDADE[campo!.vis] : "border border-border"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{campo!.rotulo}</p>
          {podeEditar && (
            <div className="flex items-center gap-2">
              {ehMestre && (
                <span className="text-xs font-medium">
                  {campo!.vis === "oculto"
                    ? t("seloOculto")
                    : campo!.vis === "mesa"
                      ? t("seloMesa")
                      : t("seloEspecificos")}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
                {t("editar")}
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{campo!.valor}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div className="space-y-1.5">
          <Label htmlFor={`rotulo-${campo?.id ?? "novo"}`}>{t("campoRotulo")}</Label>
          <Input
            id={`rotulo-${campo?.id ?? "novo"}`}
            value={rotulo}
            maxLength={80}
            autoFocus
            onChange={(e) => setRotulo(e.target.value)}
          />
        </div>
        <div className={`space-y-1.5 ${ehMestre ? "" : "hidden"}`}>
          <Label htmlFor={`vis-${campo?.id ?? "novo"}`}>{t("quemVe")}</Label>
          <select
            id={`vis-${campo?.id ?? "novo"}`}
            value={vis}
            onChange={(e) => setVis(e.target.value as Visibilidade)}
            className={CLASSE_SELECT}
          >
            <option value="oculto">{t("quemVeOculto")}</option>
            <option value="mesa">{t("quemVeMesa")}</option>
            <option value="especificos">{t("quemVeEspecificos")}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`valor-${campo?.id ?? "novo"}`}>{t("campoValor")}</Label>
        <Textarea
          id={`valor-${campo?.id ?? "novo"}`}
          value={valor}
          rows={3}
          maxLength={4000}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>

      {ehMestre && vis === "especificos" && (
        <ul className="flex flex-wrap gap-2">
          {membros.map((m) => {
            const marcado = reveladoPara.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={marcado}
                  onClick={() =>
                    setReveladoPara((atual) => (marcado ? atual.filter((id) => id !== m.id) : [...atual, m.id]))
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    marcado ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {m.nome}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="marca" size="sm" onClick={salvar} disabled={pendente || rotulo.trim().length === 0}>
          {pendente ? <Loader2 className="size-4 animate-spin" /> : t("salvar")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditando(false);
            aoFechar?.();
          }}
          disabled={pendente}
        >
          {t("cancelar")}
        </Button>
        {campo && (
          <Button variant="ghost" size="sm" onClick={apagar} disabled={pendente} className="ml-auto text-destructive">
            <Trash2 className="size-4" aria-hidden />
            {t("excluir")}
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
