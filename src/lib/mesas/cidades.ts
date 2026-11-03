/**
 * Cidades onde o site aceita mesa presencial.
 *
 * Lista fechada de propósito: a página `/presencial-bh` filtra as mesas por
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
