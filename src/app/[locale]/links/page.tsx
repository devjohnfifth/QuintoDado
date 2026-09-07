import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  MessageCircle,
  Dices,
  BookOpen,
  Camera,
  Music2,
  PlayCircle,
  MapPin,
  Coffee,
  ArrowUpRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { SITE_LINKS } from "@/lib/site-links";
import logo5d from "@/assets/brand/logo-5d.png";

export const metadata: Metadata = {
  title: "Quinto Dado — Links",
  description: "Todos os links do Quinto Dado em um só lugar.",
};

/**
 * TODO(Supabase): substituir por `select * from links where ativo order by ordem`
 * assim que o banco estiver plugado (ver docs/Modelo-de-Dados_QuintoDado_v1.sql).
 */
const linksEstaticos: { chave: string; href: string | null; Icon: LucideIcon }[] = [
  { chave: "comunidade", href: SITE_LINKS.whatsappComunidade, Icon: MessageCircle },
  { chave: "mesas", href: SITE_LINKS.mesaquest, Icon: Dices },
  { chave: "suplementos", href: "/suplementos", Icon: BookOpen },
  { chave: "instagram", href: SITE_LINKS.instagram, Icon: Camera },
  { chave: "tiktok", href: SITE_LINKS.tiktok, Icon: Music2 },
  { chave: "youtube", href: SITE_LINKS.youtube, Icon: PlayCircle },
  { chave: "presencialBh", href: "/presencial-bh", Icon: MapPin },
  { chave: "apoie", href: "/apoie", Icon: Coffee },
];

export default async function LinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Links");

  const links = linksEstaticos.filter(
    (link): link is typeof link & { href: string } => Boolean(link.href),
  );
  const [primeiro, ...resto] = links;

  return (
    <div>
      <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center px-4 py-16 sm:px-6">
        <div
          className="motion-safe:animate-[reveal-up_0.5s_ease-out_backwards]"
          style={{ animationDelay: "0ms" }}
        >
          <Image
            src={logo5d}
            alt=""
            priority
            className="mx-auto h-16 w-16 rounded-2xl ring-1 ring-border"
          />
        </div>
        <h1
          className="mt-4 font-heading text-2xl font-bold motion-safe:animate-[reveal-up_0.5s_ease-out_backwards]"
          style={{ animationDelay: "40ms" }}
        >
          {t("titulo")}
        </h1>
        <p
          className="mt-1 text-sm text-muted-foreground motion-safe:animate-[reveal-up_0.5s_ease-out_backwards]"
          style={{ animationDelay: "80ms" }}
        >
          {t("tagline")}
        </p>

        <nav className="mt-8 flex w-full flex-col gap-3">
          {primeiro && (
            <a
              href={primeiro.href}
              target={primeiro.href.startsWith("http") ? "_blank" : undefined}
              rel={primeiro.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{ animationDelay: "120ms" }}
              className="group flex transform-gpu items-center gap-3 rounded-xl bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-4 text-sm font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] motion-safe:animate-[reveal-up_0.5s_ease-out_backwards]"
            >
              <primeiro.Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{t(primeiro.chave)}</span>
              <ArrowUpRight
                className="size-4 shrink-0 opacity-80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          )}

          {resto.map(({ chave, href, Icon }, i) => {
            const externo = href.startsWith("http");
            return (
              <a
                key={chave}
                href={href}
                target={externo ? "_blank" : undefined}
                rel={externo ? "noopener noreferrer" : undefined}
                style={{ animationDelay: `${160 + i * 50}ms` }}
                className="group flex transform-gpu items-center gap-3 rounded-xl border border-border bg-card/60 px-5 py-4 text-sm font-medium transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-primary/40 motion-safe:animate-[reveal-up_0.5s_ease-out_backwards]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1">{t(chave)}</span>
                {externo ? (
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                ) : (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                )}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
