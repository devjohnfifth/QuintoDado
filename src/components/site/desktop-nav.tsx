"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function DesktopNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const links = [
    { href: "/suplementos", label: t("suplementos") },
    { href: "/mesas", label: t("mesas") },
    { href: "/eventos", label: t("eventos") },
    { href: "/presencial-bh", label: t("presencialBh") },
    { href: "/sobre", label: t("sobre") },
    { href: "/links", label: t("links") },
  ] as const;

  return (
    <nav className="hidden items-center gap-1 text-sm sm:flex">
      {links.map((link) => {
        const ativo = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={`group relative px-3 py-2 font-medium transition-colors ${
              ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
            <span
              aria-hidden
              className={`absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-[#4F7DF3] to-[#A855F7] transition-transform duration-200 ease-out group-hover:scale-x-100 ${
                ativo ? "scale-x-100" : ""
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
