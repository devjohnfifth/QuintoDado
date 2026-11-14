import { describe, it, expect } from "vitest";
import { schemaMesaDoMestre, precoEmCentavos } from "./schema-mesa-mestre";

/**
 * O valor da mesa é regra de dinheiro, então o CLAUDE.md pede teste
 * automatizado. O que vale a pena travar aqui:
 *
 *  - mesa online não pode exigir cidade (era o que travava a criação antes);
 *  - mesa presencial continua restrita às cidades atendidas;
 *  - a faixa proibida de preço (1 a 499 centavos) não passa, porque o banco
 *    recusaria com um erro de constraint que não diz nada pro mestre.
 */

/** Data futura em ISO, pra não esbarrar no refine de "data no passado". */
function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const base = {
  titulo: "A Queda de Vallaki",
  tipo: "one_shot" as const,
  sistemaId: "00000000-0000-4000-8000-000000000000",
  sinopse: "Uma noite só, e ninguém sai igual de lá.",
  dataInicio: amanha(),
  horarioInicio: "20:00",
  horarioFim: "23:00",
  vagasTotal: 5,
  minJogadores: 3,
  classificacao: "14" as const,
  nivelExperiencia: "todos" as const,
  gratuita: true,
};

describe("schemaMesaDoMestre — modalidade", () => {
  it("aceita mesa online sem cidade nenhuma", () => {
    const r = schemaMesaDoMestre.safeParse({ ...base, modalidade: "online" });
    expect(r.success).toBe(true);
  });

  it("aceita mesa online com plataformas", () => {
    const r = schemaMesaDoMestre.safeParse({
      ...base,
      modalidade: "online",
      plataformaVtt: "Foundry",
      plataformaVoz: "Discord",
    });
    expect(r.success).toBe(true);
  });

  it("aceita mesa presencial numa cidade atendida", () => {
    const r = schemaMesaDoMestre.safeParse({
      ...base,
      modalidade: "presencial",
      cidadeUf: "Belo Horizonte",
    });
    expect(r.success).toBe(true);
  });

  it("recusa mesa presencial sem cidade", () => {
    const r = schemaMesaDoMestre.safeParse({ ...base, modalidade: "presencial" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(["cidadeUf"]);
    }
  });

  it("recusa mesa presencial em cidade fora da lista", () => {
    const r = schemaMesaDoMestre.safeParse({
      ...base,
      modalidade: "presencial",
      cidadeUf: "Manaus",
    });
    expect(r.success).toBe(false);
  });

  it("recusa modalidade inventada", () => {
    const r = schemaMesaDoMestre.safeParse({ ...base, modalidade: "hibrida" });
    expect(r.success).toBe(false);
  });
});

describe("schemaMesaDoMestre — regras que já existiam", () => {
  it("recusa mínimo de jogadores acima do total de vagas", () => {
    const r = schemaMesaDoMestre.safeParse({
      ...base,
      modalidade: "online",
      vagasTotal: 3,
      minJogadores: 5,
    });
    expect(r.success).toBe(false);
  });

  it("recusa data no passado", () => {
    const r = schemaMesaDoMestre.safeParse({
      ...base,
      modalidade: "online",
      dataInicio: "2020-01-01",
    });
    expect(r.success).toBe(false);
  });
});

describe("precoEmCentavos", () => {
  it("mesa gratuita vale 0, mesmo com valor preenchido", () => {
    // O checkbox manda junto o que ficou no campo de valor; gratuita ganha.
    expect(precoEmCentavos({ gratuita: true, valorReais: 40 })).toEqual({ ok: true, centavos: 0 });
  });

  it("converte reais para centavos inteiros", () => {
    expect(precoEmCentavos({ gratuita: false, valorReais: 25 })).toEqual({
      ok: true,
      centavos: 2500,
    });
  });

  it("arredonda centavo quebrado em vez de gerar float", () => {
    const r = precoEmCentavos({ gratuita: false, valorReais: 19.99 });
    expect(r).toEqual({ ok: true, centavos: 1999 });
    if (r.ok) expect(Number.isInteger(r.centavos)).toBe(true);
  });

  it("recusa a faixa que o banco não aceita (1 a 499)", () => {
    const r = precoEmCentavos({ gratuita: false, valorReais: 3 });
    expect(r.ok).toBe(false);
  });

  it("aceita exatamente o mínimo de R$5,00", () => {
    expect(precoEmCentavos({ gratuita: false, valorReais: 5 })).toEqual({
      ok: true,
      centavos: 500,
    });
  });

  it("não marcar gratuita e deixar o valor zerado vale 0", () => {
    expect(precoEmCentavos({ gratuita: false, valorReais: 0 })).toEqual({ ok: true, centavos: 0 });
  });
});
