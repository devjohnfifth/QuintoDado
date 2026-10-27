"use client";

import { useTranslations } from "next-intl";
import { BookOpen, CalendarDays, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Abas do painel.
 *
 * Cada aba carrega quantos itens tem: antes era só o nome, e não dava pra
 * saber se valia clicar. Cliente só por causa do `usePathname`.
 */
export function AbasPainel({
  slug,
  entidades,
  sessoes,
}: {
  slug: string;
  entidades: number;
  sessoes: number;
}) {
  const t = useTranslations("Painel");
  const pathname = usePathname();
  const base = `/mesas/${slug}/painel`;

  const abas = [
    { href: base, label: t("abaVisao"), Icone: BookOpen, n: null as number | null },
    { href: `${base}/elenco`, label: t("abaElenco"), Icone: Users, n: entidades },
    { href: `${base}/sessoes`, label: t("abaSessoes"), Icone: CalendarDays, n: sessoes },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3" aria-label={t("titulo")}>
      {abas.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              ativa
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border painel text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <aba.Icone className="size-4 shrink-0" aria-hidden />
            {aba.label}
            {aba.n !== null && (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  ativa ? "bg-primary/25" : "bg-foreground/10"
                }`}
              >
                {aba.n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
