"use client";

import { useState } from "react";
import { BookOpen, Dices, Info, Link2, Menu, MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const links = [
    { href: "/suplementos", label: t("suplementos"), Icon: BookOpen },
    { href: "/mesas", label: t("mesas"), Icon: Dices },
    { href: "/presencial-bh", label: t("presencialBh"), Icon: MapPin },
    { href: "/sobre", label: t("sobre"), Icon: Info },
    { href: "/links", label: t("links"), Icon: Link2 },
  ] as const;

  const easing = "ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="sm:hidden" />}
        aria-label={t("abrirMenu")}
      >
        <span className="relative flex size-5 items-center justify-center">
          <Menu
            className={`absolute size-5 transition-all duration-300 ${easing} ${
              aberto ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <X
            className={`absolute size-5 transition-all duration-300 ${easing} ${
              aberto ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
            }`}
          />
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-72 flex-col">
        <SheetHeader>
          <SheetTitle className="text-left">Quinto Dado</SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-4">
          {links.map(({ href, label, Icon }, i) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                aria-current={ativo ? "page" : undefined}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`motion-safe:animate-[menu-item-in_0.3s_cubic-bezier(0.16,1,0.3,1)_backwards] flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <SheetFooter>
          <Link
            href="/entrar"
            onClick={() => setAberto(false)}
            style={{ animationDelay: `${links.length * 50}ms` }}
            className="motion-safe:animate-[reveal-up_0.3s_cubic-bezier(0.16,1,0.3,1)_backwards] w-full rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2.5 text-center text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("entrar")}
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
