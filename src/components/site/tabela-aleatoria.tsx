"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dices, History } from "lucide-react";
import {
  formatarFaixa,
  rolarTabela,
  rolarTudo,
  tabelasRaiz,
  type Rolagem,
  type Tabela,
} from "@/lib/suplementos/dados";

const MAX_HISTORICO = 10;

/**
 * Rótulo curto pro botão de cada tabela: se todos os títulos começam igual
 * até um ":" ("Hacking Técnico: Fácil", "Hacking Técnico: Médio"), o botão
 * mostra só o que muda. O título completo continua no cabeçalho da tabela.
 */
function rotulosCurtos(titulos: string[]): string[] {
  const prefixo = titulos[0]?.match(/^(.+?:)\s*/)?.[0];
  if (!prefixo || titulos.length < 2 || !titulos.every((t) => t.startsWith(prefixo) && t.length > prefixo.length)) {
    return titulos;
  }
  return titulos.map((t) => t.slice(prefixo.length));
}

/**
 * As tabelas inteiras saem no HTML do servidor (indexáveis); a interação só
 * acrescenta rolagem, destaque da linha sorteada e histórico da sessão.
 */
export function TabelasAleatorias({ tabelas }: { tabelas: Tabela[] }) {
  const t = useTranslations("Suplementos");
  // Última rolagem de cada tabela (inclui as aninhadas), pra destacar a linha.
  const [destaques, setDestaques] = useState<Record<string, number>>({});
  const [historico, setHistorico] = useState<Rolagem[][]>([]);
  const [animando, setAnimando] = useState<string | null>(null);
  // Com mais de uma tabela, mostra uma por vez. As outras continuam no HTML
  // (só escondidas), então o conteúdo inteiro segue indexável.
  const [selecionada, setSelecionada] = useState(tabelas[0]?.chave ?? "");
  const variasTabelas = tabelas.length > 1;
  const rotulos = rotulosCurtos(tabelas.map((tb) => tb.titulo));

  const titulo = new Map(tabelas.map((tb) => [tb.chave, tb.titulo]));
  const temVariasRaizes = tabelasRaiz(tabelas).length > 1;

  function aplicar(rolagens: Rolagem[], origem: string) {
    const novos: Record<string, number> = {};
    const visitar = (r: Rolagem) => {
      novos[r.tabelaChave] = r.valor;
      r.aninhadas.forEach(visitar);
    };
    rolagens.forEach(visitar);
    setDestaques((d) => ({ ...d, ...novos }));
    setHistorico((h) => [rolagens, ...h].slice(0, MAX_HISTORICO));
    setAnimando(origem);
    window.setTimeout(() => setAnimando(null), 400);

    const primeira = rolagens[0];
    if (primeira?.item) {
      document
        .getElementById(`linha-${primeira.tabelaChave}-${primeira.item.faixaMin}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function selecionar(chave: string) {
    setSelecionada(chave);
    document.getElementById("tabelas-seletor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function rolar(chave: string) {
    const r = rolarTabela(tabelas, chave);
    if (r) aplicar([r], chave);
  }

  return (
    <div className="space-y-6">
      {(variasTabelas || temVariasRaizes) && (
        <div id="tabelas-seletor" className="flex scroll-mt-24 flex-wrap items-center gap-2">
          {variasTabelas && (
            <div role="tablist" aria-label={t("escolherTabela")} className="flex flex-wrap gap-2">
              {tabelas.map((tabela, indice) => {
                const ativa = tabela.chave === selecionada;
                return (
                  <button
                    key={tabela.chave}
                    type="button"
                    role="tab"
                    id={`aba-${tabela.chave}`}
                    aria-selected={ativa}
                    aria-controls={`tabela-${tabela.chave}`}
                    onClick={() => setSelecionada(tabela.chave)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      ativa
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {rotulos[indice]}
                    {destaques[tabela.chave] !== undefined && (
                      <span className="ml-1.5 tabular-nums text-xs text-primary">({destaques[tabela.chave]})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {temVariasRaizes && (
            <button
              type="button"
              onClick={() => aplicar(rolarTudo(tabelas), "tudo")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-1.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02] sm:ml-auto"
            >
              <Dices className={`size-4 ${animando === "tudo" ? "animate-spin" : ""}`} aria-hidden />
              {t("rolarTudo")}
            </button>
          )}
        </div>
      )}

      {tabelas.map((tabela) => {
        const destaque = destaques[tabela.chave];
        const itemDestacado = tabela.itens.find((i) => destaque >= i.faixaMin && destaque <= i.faixaMax);
        const visivel = !variasTabelas || tabela.chave === selecionada;
        return (
          <section
            key={tabela.chave}
            id={`tabela-${tabela.chave}`}
            role={variasTabelas ? "tabpanel" : undefined}
            aria-labelledby={variasTabelas ? `aba-${tabela.chave}` : undefined}
            hidden={!visivel}
            className="rounded-2xl border border-border bg-card/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
              <h3 className="font-heading text-lg font-bold">{tabela.titulo}</h3>
              <button
                type="button"
                onClick={() => rolar(tabela.chave)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95"
              >
                <Dices className={`size-4 ${animando === tabela.chave ? "animate-spin" : ""}`} aria-hidden />
                {t("rolar", { dado: tabela.dado })}
              </button>
            </div>

            <div aria-live="polite" className="sr-only">
              {itemDestacado ? `${t("resultado")} ${destaque}: ${itemDestacado.valores.join(" — ")}` : ""}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="w-16 px-4 py-2 font-semibold">
                      {tabela.dado}
                    </th>
                    {tabela.colunas.map((c, i) => (
                      <th key={i} scope="col" className="px-4 py-2 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabela.itens.map((item) => {
                    const ativo = item === itemDestacado;
                    return (
                      <tr
                        key={item.faixaMin}
                        id={`linha-${tabela.chave}-${item.faixaMin}`}
                        className={`scroll-mt-24 border-t border-border/40 align-top transition-colors duration-300 ${
                          ativo ? "bg-primary/15" : ""
                        }`}
                      >
                        <td
                          className={`px-4 py-3 font-heading font-bold tabular-nums ${ativo ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {formatarFaixa(item)}
                        </td>
                        {tabela.colunas.map((_, i) => (
                          <td
                            key={i}
                            className={`px-4 py-3 ${i === 0 && tabela.colunas.length > 1 ? "font-medium text-foreground" : "text-muted-foreground"} ${ativo ? "text-foreground" : ""}`}
                          >
                            {item.valores[i]}
                            {i === tabela.colunas.length - 1 && item.aninhada && titulo.has(item.aninhada) && (
                              <button
                                type="button"
                                onClick={() => selecionar(item.aninhada!)}
                                className="mt-1 block text-left text-xs text-primary hover:underline"
                              >
                                {t("depoisRola", { tabela: titulo.get(item.aninhada)! })}
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {historico.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold">
              <History className="size-4 text-primary" aria-hidden />
              {t("historico")}
            </h3>
            <button
              type="button"
              onClick={() => setHistorico([])}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {t("limparHistorico")}
            </button>
          </div>
          <ol className="mt-3 space-y-2 text-sm">
            {historico.map((grupo, i) => (
              <li key={historico.length - i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
                {grupo.map((r, j) => (
                  <LinhaHistorico key={j} rolagem={r} />
                ))}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function LinhaHistorico({ rolagem, nivel = 0 }: { rolagem: Rolagem; nivel?: number }) {
  return (
    <>
      <p style={{ paddingLeft: `${nivel}rem` }}>
        {nivel > 0 && "↳ "}
        <span className="font-medium">{rolagem.tabelaTitulo}</span>{" "}
        <span className="tabular-nums text-primary">({rolagem.valor})</span>: {rolagem.item?.valores.join(" — ") ?? "—"}
      </p>
      {rolagem.aninhadas.map((a, i) => (
        <LinhaHistorico key={i} rolagem={a} nivel={nivel + 1} />
      ))}
    </>
  );
}
