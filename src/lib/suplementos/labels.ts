export const TIPOS_SUPLEMENTO = [
  "tabela_encontros",
  "tabela_loot",
  "mapa",
  "arte",
  "homebrew",
  "aventura",
  "ficha",
  "token",
  "modulo_vtt",
] as const;

export type TipoSuplemento = (typeof TIPOS_SUPLEMENTO)[number];

type InfoTipo = {
  /** Singular, pro selo no card e na página ("Mapa"). */
  rotulo: string;
  /** Plural, pro título da página de tipo ("Mapas"). */
  plural: string;
  /**
   * Slug usado em /suplementos/tipo/[tipo]. É diferente do valor do enum de
   * propósito: a URL é em português legível (`tabela-de-encontros`), o enum
   * segue a convenção do banco (`tabela_encontros`).
   */
  slugUrl: string;
};

export const TIPO_SUPLEMENTO: Record<TipoSuplemento, InfoTipo> = {
  tabela_encontros: { rotulo: "Tabela de encontros", plural: "Tabelas de encontros", slugUrl: "tabela-de-encontros" },
  tabela_loot: { rotulo: "Tabela de loot", plural: "Tabelas de loot", slugUrl: "tabela-de-loot" },
  mapa: { rotulo: "Mapa", plural: "Mapas", slugUrl: "mapa" },
  arte: { rotulo: "Arte", plural: "Artes", slugUrl: "arte" },
  homebrew: { rotulo: "Homebrew", plural: "Homebrews", slugUrl: "homebrew" },
  aventura: { rotulo: "Aventura pronta", plural: "Aventuras prontas", slugUrl: "aventura" },
  ficha: { rotulo: "Ficha", plural: "Fichas", slugUrl: "ficha" },
  token: { rotulo: "Token", plural: "Tokens", slugUrl: "token" },
  modulo_vtt: { rotulo: "Módulo de VTT", plural: "Módulos de VTT", slugUrl: "modulo-vtt" },
};

export function tipoPorSlugUrl(slugUrl: string): TipoSuplemento | null {
  const achado = TIPOS_SUPLEMENTO.find((t) => TIPO_SUPLEMENTO[t].slugUrl === slugUrl);
  return achado ?? null;
}

export const FORMATOS_ARQUIVO = ["pdf", "png", "webp", "json", "zip"] as const;
export type FormatoArquivo = (typeof FORMATOS_ARQUIVO)[number];

export const FORMATO_LABEL: Record<FormatoArquivo, string> = {
  pdf: "PDF",
  png: "PNG",
  webp: "WebP",
  json: "JSON (VTT)",
  zip: "ZIP",
};

/** Content-Type por formato — o PUT assinado do R2 exige o mesmo header no upload. */
export const MIME_POR_FORMATO: Record<FormatoArquivo, string> = {
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
  json: "application/json",
  zip: "application/zip",
};

export const TAMANHO_MAXIMO_ARQUIVO = 100 * 1024 * 1024;

export function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
