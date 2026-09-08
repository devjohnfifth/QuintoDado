import type { StaticImageData } from "next/image";
import tormenta20 from "@/assets/sistemas/tormenta-20.jpg";
import ordemParanormal from "@/assets/sistemas/ordem-paranormal-2.jpg";
import vaesen from "@/assets/sistemas/vaesen.jpg";
import daggerheart from "@/assets/sistemas/daggerheart.jpg";
import fabulaUltima from "@/assets/sistemas/fabula-ultima.jpg";
import sacramentoRpg from "@/assets/sistemas/sacramento-rpg.png";

export const LOGO_SISTEMA: Record<string, StaticImageData> = {
  "tormenta-20": tormenta20,
  "ordem-paranormal-2": ordemParanormal,
  vaesen,
  daggerheart,
  "fabula-ultima": fabulaUltima,
  "sacramento-rpg": sacramentoRpg,
};
