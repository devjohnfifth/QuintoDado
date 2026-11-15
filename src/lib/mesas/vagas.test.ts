import { describe, it, expect } from "vitest";
import { vagasLivres, mesaLotada, lotadasPorUltimo } from "./vagas";

/** Mesa mínima, só com o que a ordenação olha. */
const m = (titulo: string, vagas_total: number, vagas_preenchidas: number) => ({
  titulo,
  vagas_total,
  vagas_preenchidas,
});

describe("vagasLivres", () => {
  it("conta o que sobrou", () => {
    expect(vagasLivres(m("x", 5, 2))).toBe(3);
  });

  it("não devolve número negativo quando o mestre aprova gente demais", () => {
    expect(vagasLivres(m("x", 4, 6))).toBe(0);
    expect(mesaLotada(m("x", 4, 6))).toBe(true);
  });

  it("mesa com uma cadeira livre não está lotada", () => {
    expect(mesaLotada(m("x", 4, 3))).toBe(false);
  });
});

describe("lotadasPorUltimo", () => {
  it("manda as lotadas pro fim", () => {
    const lista = [m("cheia", 4, 4), m("aberta", 4, 1), m("cheia demais", 3, 5), m("vazia", 6, 0)];
    expect(lotadasPorUltimo(lista).map((x) => x.titulo)).toEqual([
      "aberta",
      "vazia",
      "cheia",
      "cheia demais",
    ]);
  });

  it("preserva a ordem que a lista já tinha dentro de cada grupo", () => {
    // É isso que deixa empilhar critérios: a lista chega ordenada por data (e
    // por sistema favorito), e este sort só separa cheia de aberta.
    const lista = [m("1ª lotada", 2, 2), m("1ª aberta", 2, 0), m("2ª lotada", 2, 3), m("2ª aberta", 2, 1)];
    expect(lotadasPorUltimo(lista).map((x) => x.titulo)).toEqual([
      "1ª aberta",
      "2ª aberta",
      "1ª lotada",
      "2ª lotada",
    ]);
  });

  it("lista sem mesa lotada fica igual", () => {
    const lista = [m("a", 4, 1), m("b", 4, 2), m("c", 4, 0)];
    expect(lotadasPorUltimo(lista).map((x) => x.titulo)).toEqual(["a", "b", "c"]);
  });

  it("aguenta lista vazia", () => {
    expect(lotadasPorUltimo([])).toEqual([]);
  });
});
