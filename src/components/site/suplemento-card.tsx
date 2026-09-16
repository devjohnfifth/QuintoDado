import { useTranslations } from "next-intl";
import { Dices } from "lucide-react";
import { TIPO_SUPLEMENTO, type TipoSuplemento } from "@/lib/suplementos/labels";
import type { SuplementoCardData } from "@/lib/suplementos/publico";
import { CardMidia } from "@/components/site/card-midia";
import { Selo } from "@/components/site/selo";

export function SuplementoCard({ suplemento, destaque = false }: { suplemento: SuplementoCardData; destaque?: boolean }) {
  const t = useTranslations("Suplementos");
  const tipo = TIPO_SUPLEMENTO[suplemento.tipo as TipoSuplemento]?.rotulo ?? suplemento.tipo;

  return (
    <CardMidia
      href={`/suplementos/${suplemento.slug}`}
      imagem={suplemento.capa_url}
      iconeSemImagem={Dices}
      destaque={destaque}
      selosImagem={
        <>
          {suplemento.publicado ? <span /> : <Selo tom="alerta" className="bg-alerta text-black">{t("rascunho")}</Selo>}
          <Selo tom="solido">{tipo}</Selo>
        </>
      }
    >
      <p
        className={`font-heading font-bold leading-tight transition-colors group-hover:text-primary ${destaque ? "text-2xl" : "text-lg"}`}
      >
        {suplemento.titulo}
      </p>
      <p className={`mt-1 text-sm text-muted-foreground ${destaque ? "line-clamp-4" : "line-clamp-3"}`}>{suplemento.resumo}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <Selo>{suplemento.sistemas?.nome ?? t("generico")}</Selo>
        <Selo tom="sucesso">{t("gratuito")}</Selo>
      </div>
    </CardMidia>
  );
}
