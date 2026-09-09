"use client";

import { useState } from "react";
import { BookOpen, Dices, Info, Link2, Menu, MapPin } from "lucide-react";
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

export function MobileNav({ logado }: { logado: boolean }) {
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

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      {/* A gaveta abre por cima do header (z-index maior), então o botão
          fica coberto assim que abre — sem sentido animar ele pra virar X
          se ninguém vê. O X visível é só o de dentro da gaveta (SheetContent). */}
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="sm:hidden" />}
        aria-label={aberto ? t("fecharMenu") : t("abrirMenu")}
      >
        <Menu className="size-5" />
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
        {!logado && (
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
        )}
      </SheetContent>
    </Sheet>
  );
}
