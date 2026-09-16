import { describe, expect, it } from "vitest";
import {
  DADOS,
  acharItem,
  parseItensColados,
  PROFUNDIDADE_MAXIMA,
  rolarDado,
  rolarTabela,
  rolarTudo,
  tabelasRaiz,
  validarConjunto,
  validarFaixas,
  validarTabela,
  valoresDoDado,
  type FonteAleatoria,
  type Tabela,
} from "./dados";

/** Sempre devolve o mesmo número — torna a rolagem previsível. */
const fixo = (n: number): FonteAleatoria => () => n;

function tabela(parcial: Partial<Tabela> & Pick<Tabela, "chave">): Tabela {
  return {
    titulo: parcial.chave,
    dado: "d20",
    colunas: ["Resultado"],
    itens: [{ faixaMin: 1, faixaMax: 20, valores: ["qualquer"], aninhada: null }],
    ...parcial,
  };
}

describe("valoresDoDado", () => {
  it("d20 vai de 1 a 20", () => {
    expect(valoresDoDado("d20")).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("dados comuns vão de 1 ao número de faces", () => {
    expect(valoresDoDado("d4")).toEqual([1, 2, 3, 4]);
    expect(valoresDoDado("d12")).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("d100 vai de 1 a 100", () => {
    const v = valoresDoDado("d100");
    expect(v).toHaveLength(100);
    expect(v[0]).toBe(1);
    expect(v[99]).toBe(100);
  });

  it("d66 são 36 resultados de 11 a 66, sem dígito 0, 7, 8 ou 9", () => {
    const v = valoresDoDado("d66");
    expect(v).toHaveLength(36);
    expect(v[0]).toBe(11);
    expect(v[35]).toBe(66);
    for (const n of [17, 20, 30, 47, 60, 67]) expect(v).not.toContain(n);
  });
});

describe("rolarDado", () => {
  it("usa os extremos da fonte aleatória", () => {
    expect(rolarDado("d20", fixo(0))).toBe(1);
    expect(rolarDado("d20", fixo(0.9999))).toBe(20);
    expect(rolarDado("d100", fixo(0))).toBe(1);
    expect(rolarDado("d100", fixo(0.9999))).toBe(100);
    expect(rolarDado("d66", fixo(0))).toBe(11);
    expect(rolarDado("d66", fixo(0.9999))).toBe(66);
    expect(rolarDado("d4", fixo(0.9999))).toBe(4);
    expect(rolarDado("d12", fixo(0))).toBe(1);
    expect(rolarDado("d12", fixo(0.9999))).toBe(12);
  });

  it("com a fonte segura, nunca sai do conjunto válido", () => {
    for (const dado of DADOS) {
      const validos = new Set(valoresDoDado(dado));
      for (let i = 0; i < 2000; i++) expect(validos.has(rolarDado(dado))).toBe(true);
    }
  });
});

describe("validarFaixas", () => {
  it("aceita cobertura completa sem sobreposição", () => {
    expect(
      validarFaixas("d20", [
        { faixaMin: 1, faixaMax: 10 },
        { faixaMin: 11, faixaMax: 20 },
      ]),
    ).toEqual([]);
  });

  it("aponta buraco de forma compacta", () => {
    const erros = validarFaixas("d20", [
      { faixaMin: 1, faixaMax: 4 },
      { faixaMin: 8, faixaMax: 19 },
    ]);
    expect(erros).toEqual(["Faltam resultados no d20: 5–7, 20."]);
  });

  it("aponta sobreposição", () => {
    const erros = validarFaixas("d20", [
      { faixaMin: 1, faixaMax: 12 },
      { faixaMin: 10, faixaMax: 20 },
    ]);
    expect(erros).toEqual(["Faixas sobrepostas em: 10–12."]);
  });

  it("recusa valor que não existe no d66", () => {
    const erros = validarFaixas("d66", [{ faixaMin: 11, faixaMax: 17 }]);
    expect(erros[0]).toMatch(/não é um resultado possível num d66/);
  });

  it("no d66 não junta 16 e 21 como se fossem seguidos", () => {
    const erros = validarFaixas(
      "d66",
      valoresDoDado("d66")
        .filter((v) => v !== 16 && v !== 21)
        .map((v) => ({ faixaMin: v, faixaMax: v })),
    );
    expect(erros).toEqual(["Faltam resultados no d66: 16, 21."]);
  });

  it("recusa faixa invertida", () => {
    expect(validarFaixas("d20", [{ faixaMin: 20, faixaMax: 1 }])[0]).toMatch(/maior que o fim/);
  });
});

describe("validarTabela", () => {
  it("recusa quantidade de valores diferente da de colunas", () => {
    const erros = validarTabela(
      tabela({
        chave: "a",
        colunas: ["Criatura", "Quantidade"],
        itens: [{ faixaMin: 1, faixaMax: 20, valores: ["Goblin"], aninhada: null }],
      }),
    );
    expect(erros.some((e) => e.includes("1 valor(es) pra 2 coluna(s)"))).toBe(true);
  });

  it("recusa tabela sem título e sem resultados", () => {
    const erros = validarTabela(tabela({ chave: "a", titulo: " ", itens: [] }));
    expect(erros).toContain("Toda tabela precisa de um título.");
    expect(erros.some((e) => e.includes("não tem nenhum resultado"))).toBe(true);
  });
});

describe("validarConjunto", () => {
  it("aceita aninhada válida", () => {
    const tabelas = [
      tabela({
        chave: "encontro",
        itens: [
          { faixaMin: 1, faixaMax: 10, valores: ["nada"], aninhada: null },
          { faixaMin: 11, faixaMax: 20, valores: ["tesouro"], aninhada: "loot" },
        ],
      }),
      tabela({ chave: "loot" }),
    ];
    expect(validarConjunto(tabelas)).toEqual([]);
  });

  it("aponta referência pra tabela que não existe", () => {
    const tabelas = [
      tabela({ chave: "a", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["x"], aninhada: "fantasma" }] }),
    ];
    expect(validarConjunto(tabelas).some((e) => e.includes("não existe mais"))).toBe(true);
  });

  it("detecta ciclo entre duas tabelas", () => {
    const tabelas = [
      tabela({ chave: "a", titulo: "A", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["x"], aninhada: "b" }] }),
      tabela({ chave: "b", titulo: "B", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["y"], aninhada: "a" }] }),
    ];
    expect(validarConjunto(tabelas)).toContain("Tabelas aninhadas em ciclo: A → B → A.");
  });

  it("detecta tabela que rola ela mesma", () => {
    const tabelas = [
      tabela({ chave: "a", titulo: "A", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["x"], aninhada: "a" }] }),
    ];
    expect(validarConjunto(tabelas)).toContain("Tabelas aninhadas em ciclo: A → A.");
  });

  it("detecta chave repetida", () => {
    expect(validarConjunto([tabela({ chave: "a" }), tabela({ chave: "a" })])).toContain(
      "Chave de tabela repetida: a.",
    );
  });
});

describe("rolagem", () => {
  const encontro = tabela({
    chave: "encontro",
    itens: [
      { faixaMin: 1, faixaMax: 10, valores: ["nada"], aninhada: null },
      { faixaMin: 11, faixaMax: 20, valores: ["tesouro"], aninhada: "loot" },
    ],
  });
  const loot = tabela({ chave: "loot", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["espada"], aninhada: null }] });

  it("acha o item pela faixa", () => {
    expect(acharItem(encontro, 3)?.valores).toEqual(["nada"]);
    expect(acharItem(encontro, 15)?.valores).toEqual(["tesouro"]);
  });

  it("resolve a tabela aninhada", () => {
    const r = rolarTabela([encontro, loot], "encontro", fixo(0.9999));
    expect(r?.item?.valores).toEqual(["tesouro"]);
    expect(r?.aninhadas).toHaveLength(1);
    expect(r?.aninhadas[0].item?.valores).toEqual(["espada"]);
  });

  it("não rola aninhada quando o resultado não aponta pra nenhuma", () => {
    expect(rolarTabela([encontro, loot], "encontro", fixo(0))?.aninhadas).toEqual([]);
  });

  it("tabelas raiz são as que ninguém aponta", () => {
    expect(tabelasRaiz([encontro, loot]).map((t) => t.chave)).toEqual(["encontro"]);
  });

  it("rolar tudo rola só as raízes (a aninhada vem dentro)", () => {
    const r = rolarTudo([encontro, loot], fixo(0.9999));
    expect(r.map((x) => x.tabelaChave)).toEqual(["encontro"]);
    expect(r[0].aninhadas[0].tabelaChave).toBe("loot");
  });

  it("dado corrompido em ciclo não trava: para no primeiro retorno", () => {
    const a = tabela({ chave: "a", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["x"], aninhada: "b" }] });
    const b = tabela({ chave: "b", itens: [{ faixaMin: 1, faixaMax: 20, valores: ["y"], aninhada: "a" }] });
    const r = rolarTabela([a, b], "a", fixo(0));
    expect(r?.aninhadas[0].tabelaChave).toBe("b");
    expect(r?.aninhadas[0].aninhadas).toEqual([]);
  });

  it("respeita a profundidade máxima numa cadeia longa", () => {
    const cadeia = Array.from({ length: PROFUNDIDADE_MAXIMA + 3 }, (_, i) =>
      tabela({
        chave: `t${i}`,
        itens: [{ faixaMin: 1, faixaMax: 20, valores: [String(i)], aninhada: `t${i + 1}` }],
      }),
    );
    let r = rolarTabela(cadeia, "t0", fixo(0));
    let niveis = 0;
    while (r) {
      niveis++;
      r = r.aninhadas[0] ?? null;
    }
    expect(niveis).toBe(PROFUNDIDADE_MAXIMA);
  });
});

describe("parseItensColados", () => {
  it("lê faixas com colunas separadas por TAB", () => {
    const { itens, erros } = parseItensColados("1-4\tGoblins\t2d6\n5-20\tLobos\t1d4", "d20", 2);
    expect(erros).toEqual([]);
    expect(itens).toEqual([
      { faixaMin: 1, faixaMax: 4, valores: ["Goblins", "2d6"], aninhada: null },
      { faixaMin: 5, faixaMax: 20, valores: ["Lobos", "1d4"], aninhada: null },
    ]);
  });

  it("aceita faixa com espaço e travessão numa coluna só", () => {
    const { itens } = parseItensColados("1–10 Nada acontece\n11 Emboscada", "d20", 1);
    expect(itens.map((i) => [i.faixaMin, i.faixaMax, i.valores[0]])).toEqual([
      [1, 10, "Nada acontece"],
      [11, 11, "Emboscada"],
    ]);
  });

  it("sem faixa, distribui em partes iguais (10 linhas num d20 = de 2 em 2)", () => {
    const texto = Array.from({ length: 10 }, (_, i) => `Resultado ${i + 1}`).join("\n");
    const { itens, erros } = parseItensColados(texto, "d20", 1);
    expect(erros).toEqual([]);
    expect(itens[0]).toMatchObject({ faixaMin: 1, faixaMax: 2 });
    expect(itens[9]).toMatchObject({ faixaMin: 19, faixaMax: 20 });
    expect(validarFaixas("d20", itens)).toEqual([]);
  });

  it("sem faixa num d66, 6 linhas viram 11–16, 21–26…", () => {
    const texto = ["a", "b", "c", "d", "e", "f"].join("\n");
    const { itens } = parseItensColados(texto, "d66", 1);
    expect(itens.map((i) => [i.faixaMin, i.faixaMax])).toEqual([
      [11, 16],
      [21, 26],
      [31, 36],
      [41, 46],
      [51, 56],
      [61, 66],
    ]);
    expect(validarFaixas("d66", itens)).toEqual([]);
  });

  it("recusa quantidade que não divide o dado", () => {
    const { erros } = parseItensColados("a\nb\nc", "d20", 1);
    expect(erros[0]).toMatch(/não dividem o d20/);
  });

  it("recusa mistura de linhas com e sem faixa", () => {
    const { erros } = parseItensColados("1-10\tA\nB", "d20", 1);
    expect(erros[0]).toMatch(/Algumas linhas têm faixa/);
  });

  it("recusa mais valores que colunas e completa quando há menos", () => {
    expect(parseItensColados("1-20\ta\tb\tc", "d20", 2).erros[0]).toMatch(/3 valores pra 2 coluna/);
    expect(parseItensColados("1-20\ta", "d20", 3).itens[0].valores).toEqual(["a", "", ""]);
  });

  it("ignora linhas em branco", () => {
    expect(parseItensColados("\n  \n1-20\tx\n\n", "d20", 1).itens).toHaveLength(1);
  });
});
