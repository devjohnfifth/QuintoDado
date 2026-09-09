import type { StaticImageData } from "next/image";
import tormenta20 from "@/assets/sistemas/tormenta-20.jpg";
import ordemParanormal from "@/assets/sistemas/ordem-paranormal-2.jpg";
import vaesen from "@/assets/sistemas/vaesen.jpg";
import daggerheart from "@/assets/sistemas/daggerheart.jpg";
import fabulaUltima from "@/assets/sistemas/fabula-ultima.jpg";
import sacramentoRpg from "@/assets/sistemas/sacramento-rpg.png";
import vampiroAMascara from "@/assets/sistemas/vampiro-a-mascara.jpg";
import pathfinder2e from "@/assets/sistemas/pathfinder-2e.png";
import dnd2024 from "@/assets/sistemas/dnd-2024.png";
import chamadoDeCthulhu from "@/assets/sistemas/chamado-de-cthulhu.png";

export const LOGO_SISTEMA: Record<string, StaticImageData> = {
  "tormenta-20": tormenta20,
  "ordem-paranormal-2": ordemParanormal,
  vaesen,
  daggerheart,
  "fabula-ultima": fabulaUltima,
  "sacramento-rpg": sacramentoRpg,
  "vampiro-a-mascara": vampiroAMascara,
  "pathfinder-2e": pathfinder2e,
  "dnd-2024": dnd2024,
  "chamado-de-cthulhu": chamadoDeCthulhu,
};
