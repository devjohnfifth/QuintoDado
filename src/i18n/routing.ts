import { defineRouting } from "next-intl/routing";

/**
 * v1 só publica pt-BR (decisão 5.9.1 do documento de projeto). "en" fica de
 * fora do array até a Fase 2 para não gerar rotas /en vazias — mas
 * localePrefix "as-needed" já garante que, quando "en" entrar, pt-BR
 * continua sem prefixo e só /en/... ganha prefixo (nunca /pt/...).
 */
export const routing = defineRouting({
  locales: ["pt-BR"],
  defaultLocale: "pt-BR",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
