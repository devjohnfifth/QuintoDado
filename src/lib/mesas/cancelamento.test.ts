import { describe, it, expect } from "vitest";
import {
  HORAS_MESA_CANCELADA_VISIVEL,
  limiteMesaCanceladaVisivel,
  filtroMesasSemCanceladasAntigas,
  mesaVisivelParaODono,
} from "./cancelamento";

/**
 * A regra é simples, mas é fácil de quebrar sem ninguém notar: o filtro do
 * banco e o filtro em memória precisam continuar concordando, e o caso do
 * `cancelado_em` nulo é o que mais engana.
 */

const AGORA = new Date("2026-11-15T12:00:00.000Z");
const ONTEM_CEDO = "2026-11-15T11:00:00.000Z"; // 1h atrás
const ANTEONTEM = "2026-11-13T12:00:00.000Z"; // 48h atrás
// Formato que o Postgres devolve de verdade (`+00:00`, não `Z`).
const LIMITE_EXATO = "2026-11-14T12:00:00.000+00:00";

describe("mesaVisivelParaODono", () => {
  it("mesa que não foi cancelada aparece sempre", () => {
    expect(mesaVisivelParaODono({ status: "publicada", cancelado_em: null }, AGORA)).toBe(true);
    // Mesmo que tenha sido cancelada e reaberta um dia: o status é que manda.
    expect(mesaVisivelParaODono({ status: "publicada", cancelado_em: ANTEONTEM }, AGORA)).toBe(true);
  });

  it("mesa cancelada há pouco ainda aparece", () => {
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: ONTEM_CEDO }, AGORA)).toBe(true);
  });

  it("mesa cancelada há mais de um dia some", () => {
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: ANTEONTEM }, AGORA)).toBe(false);
  });

  it("entende o fuso que o Postgres devolve, não só o Z", () => {
    // Exatamente no limite: ainda aparece. Comparar como texto daria errado
    // aqui, porque "+" vem antes de "Z" na tabela de caracteres.
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: LIMITE_EXATO }, AGORA)).toBe(true);
  });

  it("mesa cancelada sem data de cancelamento some", () => {
    // Cancelada antes da coluna existir, ou direto no banco: sem data, é antiga.
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: null }, AGORA)).toBe(false);
  });

  it("data inválida não vira mesa eterna", () => {
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: "ontem" }, AGORA)).toBe(false);
  });
});

describe("limiteMesaCanceladaVisivel", () => {
  it("é exatamente a janela configurada atrás", () => {
    expect(limiteMesaCanceladaVisivel(AGORA)).toBe("2026-11-14T12:00:00.000Z");
    expect(HORAS_MESA_CANCELADA_VISIVEL).toBe(24);
  });
});

describe("filtroMesasSemCanceladasAntigas", () => {
  it("monta o `.or()` do PostgREST com os dois lados da regra", () => {
    expect(filtroMesasSemCanceladasAntigas(AGORA)).toBe(
      "status.neq.cancelada,cancelado_em.gte.2026-11-14T12:00:00.000Z",
    );
  });

  it("concorda com o filtro em memória sobre o mesmo cancelamento", () => {
    // Guarda contra as duas implementações divergirem: o instante que o filtro
    // do banco usa como corte é o mesmo que o de memória.
    const corte = filtroMesasSemCanceladasAntigas(AGORA).split("cancelado_em.gte.")[1];
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: corte }, AGORA)).toBe(true);
    const umMsAntes = new Date(Date.parse(corte) - 1).toISOString();
    expect(mesaVisivelParaODono({ status: "cancelada", cancelado_em: umMsAntes }, AGORA)).toBe(false);
  });
});
