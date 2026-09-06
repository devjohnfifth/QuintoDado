import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quinto Dado — Links",
  description: "Todos os links do Quinto Dado em um só lugar.",
};

/**
 * TODO(Supabase): substituir por `select * from links where ativo order by ordem`
 * assim que o banco estiver plugado (ver docs/Modelo-de-Dados_QuintoDado_v1.sql).
 * As URLs de TikTok, YouTube e MesaQuest ainda não foram confirmadas pelo
 * admin — ficam como "#" até serem preenchidas pela tabela `links`.
 */
const linksEstaticos = [
  { chave: "comunidade", href: "#", icone: "💬" },
  { chave: "mesas", href: "/mesas", icone: "🎲" },
  { chave: "suplementos", href: "/suplementos", icone: "📚" },
  { chave: "instagram", href: "https://www.instagram.com/quintodado/", icone: "📷" },
  { chave: "tiktok", href: "#", icone: "🎵" },
  { chave: "youtube", href: "#", icone: "▶️" },
  { chave: "mesaquest", href: "#", icone: "🗡️" },
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
        {linksEstaticos.map((link) => (
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
