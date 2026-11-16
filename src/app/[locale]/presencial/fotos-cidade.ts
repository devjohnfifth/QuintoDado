import type { StaticImageData } from "next/image";
import pracaSete from "@/assets/presencial/praca-sete.webp";
import fortaleza from "@/assets/presencial/fortaleza.webp";
import bannerOg from "@/assets/brand/banner-og.webp";
import type { CidadePresencial } from "@/lib/mesas/cidades";

/**
 * A foto de cada cidade atendida.
 *
 * Mapa parcial de propósito: cidade entra na lista antes de existir foto
 * dela, e ilustrar Curitiba com a Praça Sete seria mostrar uma cidade no
 * lugar da outra. Quem não tem foto cai no banner da marca — fundo neutro
 * é melhor que fundo errado.
 *
 * Quando chegar foto nova, basta somar a linha aqui: o herói e o Open Graph
 * das páginas de cidade leem deste mapa, não de um `if` por nome de cidade.
 */
export const FOTO_CIDADE: Partial<Record<CidadePresencial, StaticImageData>> = {
  "Belo Horizonte": pracaSete,
  Fortaleza: fortaleza,
};

/** A imagem que vai pro Open Graph da cidade — com o banner da marca como rede. */
export function fotoOuBanner(cidade: CidadePresencial): StaticImageData {
  return FOTO_CIDADE[cidade] ?? bannerOg;
}
