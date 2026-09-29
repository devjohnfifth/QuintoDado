"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/** Abas do painel. Cliente só por causa do `usePathname` (qual aba está ativa). */
export function AbasPainel({ slug }: { slug: string }) {
  const t = useTranslations("Painel");
  const pathname = usePathname();
  const base = `/mesas/${slug}/painel`;

  const abas = [
    { href: base, label: t("abaVisao") },
    { href: `${base}/elenco`, label: t("abaElenco") },
    { href: `${base}/sessoes`, label: t("abaSessoes") },
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("titulo")}>
      {abas.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              ativa
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {aba.label}
          </Link>
        );
      })}
    </nav>
  );
}
