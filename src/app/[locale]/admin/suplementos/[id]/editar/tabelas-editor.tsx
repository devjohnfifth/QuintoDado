"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2, ClipboardPaste, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DADOS,
  parseItensColados,
  validarConjunto,
  valoresDoDado,
  type Dado,
  type ItemTabela,
  type Tabela,
} from "@/lib/suplementos/dados";
import { salvarTabelasAction } from "../../actions";
import { CLASSE_SELECT } from "../../suplemento-dados-form";

function novaChave() {
  return crypto.randomUUID();
}

function novaTabela(): Tabela {
  return {
    chave: novaChave(),
    titulo: "",
    dado: "d20",
    colunas: ["Resultado"],
    itens: [{ faixaMin: 1, faixaMax: 20, valores: [""], aninhada: null }],
  };
}

/** Primeiro resultado do dado que nenhuma linha cobre — vira a faixa da linha nova. */
function proximoLivre(tabela: Tabela) {
  const valores = valoresDoDado(tabela.dado);
  const livre = valores.find((v) => !tabela.itens.some((i) => v >= i.faixaMin && v <= i.faixaMax));
  return livre ?? valores[valores.length - 1];
}

export function TabelasEditor({ suplementoId, iniciais }: { suplementoId: string; iniciais: Tabela[] }) {
  const router = useRouter();
  const [tabelas, setTabelas] = useState<Tabela[]>(iniciais);
  const [colando, setColando] = useState<string | null>(null);
  const [textoColado, setTextoColado] = useState("");
  const [erroColar, setErroColar] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  const erros = useMemo(() => validarConjunto(tabelas), [tabelas]);

  function mudarTabela(chave: string, muda: (t: Tabela) => Tabela) {
    setSalvo(false);
    setTabelas((atual) => atual.map((t) => (t.chave === chave ? muda(t) : t)));
  }

  function mudarItem(chave: string, indice: number, muda: (i: ItemTabela) => ItemTabela) {
    mudarTabela(chave, (t) => ({ ...t, itens: t.itens.map((i, idx) => (idx === indice ? muda(i) : i)) }));
  }

  function removerTabela(chave: string) {
    setSalvo(false);
    // Linhas de outras tabelas que apontavam pra essa deixam de rolar aninhada.
    setTabelas((atual) =>
      atual
        .filter((t) => t.chave !== chave)
        .map((t) => ({
          ...t,
          itens: t.itens.map((i) => (i.aninhada === chave ? { ...i, aninhada: null } : i)),
        })),
    );
  }

  function aplicarColagem(tabela: Tabela) {
    const { itens, erros: errosParse } = parseItensColados(textoColado, tabela.dado, tabela.colunas.length);
    if (errosParse.length > 0) {
      setErroColar(errosParse.join(" "));
      return;
    }
    mudarTabela(tabela.chave, (t) => ({ ...t, itens }));
    setColando(null);
    setTextoColado("");
    setErroColar(null);
  }

  function salvar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const r = await salvarTabelasAction(suplementoId, tabelas);
      if (!r.ok) return setErro(r.error);
      setSalvo(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {tabelas.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Nenhuma tabela. Tabela aleatória não vira PDF: ela é rolada na página e indexada pelo Google.
        </p>
      )}

      {tabelas.map((tabela) => {
        const outras = tabelas.filter((t) => t.chave !== tabela.chave);
        return (
          <div key={tabela.chave} className="space-y-4 rounded-xl border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Título da tabela</Label>
                <Input
                  value={tabela.titulo}
                  maxLength={120}
                  placeholder="Ex.: Encontros no pântano"
                  onChange={(e) => mudarTabela(tabela.chave, (t) => ({ ...t, titulo: e.target.value }))}
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs text-muted-foreground">Dado</Label>
                <select
                  value={tabela.dado}
                  className={CLASSE_SELECT}
                  onChange={(e) => mudarTabela(tabela.chave, (t) => ({ ...t, dado: e.target.value as Dado }))}
                >
                  {DADOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removerTabela(tabela.chave)}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remover tabela
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Colunas</Label>
              <div className="flex flex-wrap items-center gap-2">
                {tabela.colunas.map((coluna, ci) => (
                  <div key={ci} className="flex items-center gap-1">
                    <Input
                      value={coluna}
                      maxLength={60}
                      className="w-36"
                      onChange={(e) =>
                        mudarTabela(tabela.chave, (t) => ({
                          ...t,
                          colunas: t.colunas.map((c, idx) => (idx === ci ? e.target.value : c)),
                        }))
                      }
                    />
                    {tabela.colunas.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remover coluna ${coluna || ci + 1}`}
                        onClick={() =>
                          mudarTabela(tabela.chave, (t) => ({
                            ...t,
                            colunas: t.colunas.filter((_, idx) => idx !== ci),
                            itens: t.itens.map((i) => ({ ...i, valores: i.valores.filter((_, idx) => idx !== ci) })),
                          }))
                        }
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {tabela.colunas.length < 8 && (
                  <button
                    type="button"
                    onClick={() =>
                      mudarTabela(tabela.chave, (t) => ({
                        ...t,
                        colunas: [...t.colunas, ""],
                        itens: t.itens.map((i) => ({ ...i, valores: [...i.valores, ""] })),
                      }))
                    }
                    className="flex h-8 items-center gap-1 rounded-md border border-dashed border-border px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Coluna
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-36 pb-1 pr-2 font-normal">Faixa</th>
                    {tabela.colunas.map((c, ci) => (
                      <th key={ci} className="min-w-[140px] pb-1 pr-2 font-normal">
                        {c || `Coluna ${ci + 1}`}
                      </th>
                    ))}
                    {outras.length > 0 && <th className="w-44 pb-1 pr-2 font-normal">Depois rola</th>}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {tabela.itens.map((item, ii) => (
                    <tr key={ii} className="align-top">
                      <td className="py-1 pr-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            aria-label="Início da faixa"
                            value={Number.isNaN(item.faixaMin) ? "" : item.faixaMin}
                            className="w-16 px-1.5 text-center"
                            onChange={(e) =>
                              mudarItem(tabela.chave, ii, (i) => ({ ...i, faixaMin: parseInt(e.target.value, 10) }))
                            }
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="number"
                            aria-label="Fim da faixa"
                            value={Number.isNaN(item.faixaMax) ? "" : item.faixaMax}
                            className="w-16 px-1.5 text-center"
                            onChange={(e) =>
                              mudarItem(tabela.chave, ii, (i) => ({ ...i, faixaMax: parseInt(e.target.value, 10) }))
                            }
                          />
                        </div>
                      </td>
                      {tabela.colunas.map((_, ci) => (
                        <td key={ci} className="py-1 pr-2">
                          <Input
                            value={item.valores[ci] ?? ""}
                            maxLength={1000}
                            onChange={(e) =>
                              mudarItem(tabela.chave, ii, (i) => ({
                                ...i,
                                valores: i.valores.map((v, idx) => (idx === ci ? e.target.value : v)),
                              }))
                            }
                          />
                        </td>
                      ))}
                      {outras.length > 0 && (
                        <td className="py-1 pr-2">
                          <select
                            value={item.aninhada ?? ""}
                            className={CLASSE_SELECT}
                            onChange={(e) =>
                              mudarItem(tabela.chave, ii, (i) => ({ ...i, aninhada: e.target.value || null }))
                            }
                          >
                            <option value="">—</option>
                            {outras.map((o) => (
                              <option key={o.chave} value={o.chave}>
                                {o.titulo || "Tabela sem título"}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="py-1">
                        <button
                          type="button"
                          aria-label="Remover linha"
                          onClick={() =>
                            mudarTabela(tabela.chave, (t) => ({ ...t, itens: t.itens.filter((_, idx) => idx !== ii) }))
                          }
                          className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={tabela.itens.length >= 100}
                onClick={() =>
                  mudarTabela(tabela.chave, (t) => {
                    const valor = proximoLivre(t);
                    return {
                      ...t,
                      itens: [...t.itens, { faixaMin: valor, faixaMax: valor, valores: t.colunas.map(() => ""), aninhada: null }],
                    };
                  })
                }
                className="gap-1"
              >
                <Plus className="size-3.5" aria-hidden />
                Linha
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setColando(colando === tabela.chave ? null : tabela.chave);
                  setTextoColado("");
                  setErroColar(null);
                }}
                className="gap-1"
              >
                <ClipboardPaste className="size-3.5" aria-hidden />
                Colar itens
              </Button>
            </div>

            {colando === tabela.chave && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Cole da planilha ou digite uma linha por resultado. Com faixa: <code>1-4</code> + TAB + colunas. Sem
                  faixa: as linhas são distribuídas em partes iguais pelo {tabela.dado}. Isso{" "}
                  <strong>substitui</strong> as linhas atuais dessa tabela.
                </p>
                <Textarea
                  rows={6}
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  placeholder={"1-4\tGoblins\t2d6\n5-10\tLobos\t1d4"}
                />
                {erroColar && <p className="text-xs text-destructive">{erroColar}</p>}
                <Button type="button" size="sm" onClick={() => aplicarColagem(tabela)}>
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        disabled={tabelas.length >= 20}
        onClick={() => {
          setSalvo(false);
          setTabelas((atual) => [...atual, novaTabela()]);
        }}
        className="gap-1"
      >
        <Plus className="size-4" aria-hidden />
        Nova tabela
      </Button>

      {erros.length > 0 && (
        <ul className="list-disc space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 pl-7 text-xs text-destructive">
          {erros.slice(0, 8).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
          {erros.length > 8 && <li>…e mais {erros.length - 8}.</li>}
        </ul>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {salvo && <p className="text-sm text-emerald-400">Tabelas salvas.</p>}

      <div>
        <Button type="button" onClick={salvar} disabled={pending || erros.length > 0}>
          {pending ? "Salvando..." : "Salvar tabelas"}
        </Button>
      </div>
    </div>
  );
}
