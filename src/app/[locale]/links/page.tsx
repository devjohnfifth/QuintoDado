import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SITE_LINKS } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Quinto Dado — Links",
  description: "Todos os links do Quinto Dado em um só lugar.",
};

/**
 * TODO(Supabase): substituir por `select * from links where ativo order by ordem`
 * assim que o banco estiver plugado (ver docs/Modelo-de-Dados_QuintoDado_v1.sql).
 */
const linksEstaticos = [
  { chave: "comunidade", href: SITE_LINKS.whatsappComunidade, icone: "💬" },
  { chave: "mesas", href: SITE_LINKS.mesaquest, icone: "🎲" },
  { chave: "suplementos", href: "/suplementos", icone: "📚" },
  { chave: "instagram", href: SITE_LINKS.instagram, icone: "📷" },
  { chave: "tiktok", href: SITE_LINKS.tiktok, icone: "🎵" },
  { chave: "youtube", href: SITE_LINKS.youtube, icone: "▶️" },
  { chave: "presencialBh", href: "/presencial-bh", icone: "🗺️" },
  { chave: "apoie", href: "/apoie", icone: "☕" },
] as const;

export default async function LinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Links");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <h1 className="font-heading text-2xl font-bold">{t("titulo")}</h1>

      <nav className="mt-8 flex w-full flex-col gap-3">
        {linksEstaticos
          .filter((link): link is typeof link & { href: string } => Boolean(link.href))
          .map((link) => (
            <a
              key={link.chave}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span aria-hidden>{link.icone}</span>
              {t(link.chave)}
            </a>
          ))}
      </nav>
    </div>
  );
}
