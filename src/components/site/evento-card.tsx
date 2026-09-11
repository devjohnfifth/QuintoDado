import Image from "next/image";
import { Calendar, MapPin, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";

export type EventoCardData = {
  slug: string;
  titulo: string;
  subtitulo: string | null;
  cidade_uf: string;
  data_inicio: string;
  banner_url: string | null;
  evento_ingresso_tipos: { preco_centavos: number }[] | null;
};

export function EventoCard({ evento }: { evento: EventoCardData }) {
  const precos = (evento.evento_ingresso_tipos ?? []).map((t) => t.preco_centavos);
  const menorPreco = precos.length > 0 ? Math.min(...precos) : null;

  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 transition-colors duration-300 hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
        {evento.banner_url ? (
          <Image
            src={evento.banner_url}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 640px) 320px, 90vw"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[#4F7DF3]/40 to-[#A855F7]/40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Calendar className="size-2.5 shrink-0" aria-hidden />
          {new Date(`${evento.data_inicio}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Tag className="size-2.5 shrink-0" aria-hidden />
          Evento
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-heading text-base font-bold leading-tight">{evento.titulo}</p>
        {evento.subtitulo && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{evento.subtitulo}</p>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0 text-primary" aria-hidden />
          {evento.cidade_uf}
        </p>
        {menorPreco !== null && (
          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            A partir de {formatBRL(menorPreco)}
          </span>
        )}
      </div>
    </Link>
  );
}
