import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dices, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TIPO_SUPLEMENTO, type TipoSuplemento } from "@/lib/suplementos/labels";
import type { SuplementoCardData } from "@/lib/suplementos/publico";

export function SuplementoCard({ suplemento }: { suplemento: SuplementoCardData }) {
  const t = useTranslations("Suplementos");
  const tipo = TIPO_SUPLEMENTO[suplemento.tipo as TipoSuplemento]?.rotulo ?? suplemento.tipo;

  return (
    <Link
      href={`/suplementos/${suplemento.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 transition-colors duration-300 hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
        {suplemento.capa_url ? (
          <Image
            src={suplemento.capa_url}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#4F7DF3]/40 to-[#A855F7]/40"
          >
            <Dices className="size-10 text-white/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Tag className="size-2.5 shrink-0" aria-hidden />
          {tipo}
        </span>
        {!suplemento.publicado && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-black">
            {t("rascunho")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-heading text-base font-bold leading-tight transition-colors group-hover:text-primary">
          {suplemento.titulo}
        </p>
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{suplemento.resumo}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {suplemento.sistemas?.nome ?? t("generico")}
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            {t("gratuito")}
          </span>
        </div>
      </div>
    </Link>
  );
}
