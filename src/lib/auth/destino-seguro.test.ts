import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino-seguro";

describe("destinoSeguro", () => {
  it("aceita caminho interno", () => {
    expect(destinoSeguro("/suplementos/20-encontros-na-vila")).toBe("/suplementos/20-encontros-na-vila");
  });

  it("recusa domínio externo e esquemas", () => {
    expect(destinoSeguro("//evil.com")).toBe("/");
    expect(destinoSeguro("/\\evil.com")).toBe("/");
    expect(destinoSeguro("https://evil.com")).toBe("/");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/");
  });

  it("sem valor volta pro início", () => {
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
  });
});
