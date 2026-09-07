"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const t = useTranslations("Nav");
  const [aberto, setAberto] = useState(false);

  const links = [
    { href: "/suplementos", label: t("suplementos") },
    { href: "/mesas", label: t("mesas") },
    { href: "/presencial-bh", label: t("presencialBh") },
    { href: "/sobre", label: t("sobre") },
    { href: "/links", label: t("links") },
  ] as const;

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="sm:hidden" />}
        aria-label={t("abrirMenu")}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left">Quinto Dado</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAberto(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
