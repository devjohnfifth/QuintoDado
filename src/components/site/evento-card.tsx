import { useTranslations } from "next-intl";
import { Calendar, CalendarDays, MapPin } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { CardMidia } from "@/components/site/card-midia";
import { Selo } from "@/components/site/selo";

export type EventoCardData = {
  slug: string;
  titulo: string;
  subtitulo: string | null;
  cidade_uf: string;
  data_inicio: string;
  banner_url: string | null;
  evento_ingresso_tipos: { preco_centavos: number }[] | null;
};

export function EventoCard({ evento, destaque = false }: { evento: EventoCardData; destaque?: boolean }) {
  const t = useTranslations("Eventos");
  const precos = (evento.evento_ingresso_tipos ?? []).map((tp) => tp.preco_centavos);
  const menorPreco = precos.length > 0 ? Math.min(...precos) : null;
  const data = new Date(`${evento.data_inicio}T00:00:00`);

  return (
    <CardMidia
      href={`/eventos/${evento.slug}`}
      imagem={evento.banner_url}
      iconeSemImagem={CalendarDays}
      destaque={destaque}
      selosImagem={
        <>
          <Selo tom="imagem" icone={Calendar}>
            {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </Selo>
          <Selo tom="solido">{t("selo")}</Selo>
        </>
      }
    >
      <p
        className={`font-heading font-bold leading-tight transition-colors group-hover:text-primary ${destaque ? "text-2xl" : "text-lg"}`}
      >
        {evento.titulo}
      </p>
      {evento.subtitulo && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{evento.subtitulo}</p>}
      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {destaque && (
          <p className="flex items-center gap-1.5">
            <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
            {data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          {evento.cidade_uf}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        {menorPreco !== null && <Selo>{t("aPartirDe", { preco: formatBRL(menorPreco) })}</Selo>}
        {destaque && (
          <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
            {t("verEvento")} →
          </span>
        )}
      </div>
    </CardMidia>
  );
}
