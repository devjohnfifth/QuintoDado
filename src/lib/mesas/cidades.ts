/**
 * Cidades onde o site aceita mesa presencial.
 *
 * Lista fechada de propósito: a página `/presencial` filtra as mesas por
 * ela, então cidade escrita à mão (com acento trocado, abreviação ou UF
 * grudada) sumiria da listagem sem ninguém entender por quê. O formulário
 * oferece só estas e o servidor recusa qualquer outra.
 *
 * O formato é o nome puro da cidade, sem UF — é como o registro que já existe
 * no banco está gravado, e são todas capitais sem ambiguidade. Mudar pra
 * "Cidade - UF" exigiria migrar os dados antigos antes.
 */
export const CIDADES_PRESENCIAIS = [
  "Belo Horizonte",
  "São Paulo",
  "Rio de Janeiro",
  "Fortaleza",
  "Curitiba",
] as const;

export type CidadePresencial = (typeof CIDADES_PRESENCIAIS)[number];

export function ehCidadePresencial(valor: string): valor is CidadePresencial {
  return (CIDADES_PRESENCIAIS as readonly string[]).includes(valor);
}

/** Slug de cada cidade, pro filtro viver na URL sem acento nem espaço. */
export const SLUG_CIDADE: Record<CidadePresencial, string> = {
  "Belo Horizonte": "belo-horizonte",
  "São Paulo": "sao-paulo",
  "Rio de Janeiro": "rio-de-janeiro",
  Fortaleza: "fortaleza",
  Curitiba: "curitiba",
};

/** Caminho de volta: slug da URL para o nome gravado no banco. */
export function cidadeDoSlug(slug: string | undefined): CidadePresencial | null {
  if (!slug) return null;
  const achada = CIDADES_PRESENCIAIS.find((c) => SLUG_CIDADE[c] === slug);
  return achada ?? null;
}

/**
 * As cidades atendidas em texto corrido: "A, B, C e D".
 *
 * Existe pra nenhum texto do site repetir essa lista à mão. Quando uma cidade
 * nova entrar em `CIDADES_PRESENCIAIS`, ela aparece sozinha na FAQ, na ajuda
 * do formulário e na seção de cidades atendidas — em vez de quatro textos
 * ficarem desatualizados em silêncio, que é o que acontecia antes.
 */
export function listaDeCidades(cidades: readonly string[] = CIDADES_PRESENCIAIS): string {
  if (cidades.length === 0) return "";
  if (cidades.length === 1) return cidades[0];
  return `${cidades.slice(0, -1).join(", ")} e ${cidades[cidades.length - 1]}`;
}
