"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function DesktopNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  // Suplementos: fora do menu por enquanto (catálogo ainda "em construção"),
  // volta quando o conteúdo estiver pronto pra valer — ver MEMORY.md.
  // Links: fica de fora de propósito — a página só deve ser acessada como
  // link-in-bio externo (Instagram/TikTok), nunca navegada a partir do site.
  const links = [
    { href: "/suplementos", label: t("suplementos") },
    { href: "/mesas", label: t("mesas") },
    { href: "/eventos", label: t("eventos") },
    { href: "/presencial-bh", label: t("presencialBh") },
    { href: "/sobre", label: t("sobre") },
  ] as const;

  return (
    <nav className="hidden items-center gap-0.5 text-sm lg:flex">
      {links.map((link) => {
        const ativo = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={`group relative whitespace-nowrap px-2.5 py-2 font-medium transition-colors xl:px-3 ${
              ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
            <span
              aria-hidden
              className={`absolute inset-x-2.5 -bottom-px xl:inset-x-3 h-px origin-left scale-x-0 bg-marca transition-transform duration-200 ease-out group-hover:scale-x-100 ${
                ativo ? "scale-x-100" : ""
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
