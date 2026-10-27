"use client";

import { useState } from "react";
import { BookOpen, Dices, Info, Menu, MapPin, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
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

  // Suplementos: fora do menu por enquanto (catálogo ainda "em construção"),
  // volta quando o conteúdo estiver pronto pra valer — ver MEMORY.md.
  // Links: fica de fora de propósito — a página só deve ser acessada como
  // link-in-bio externo (Instagram/TikTok), nunca navegada a partir do site.
  const links = [
    { href: "/suplementos", label: t("suplementos"), Icon: BookOpen },
    { href: "/mesas", label: t("mesas"), Icon: Dices },
    { href: "/eventos", label: t("eventos"), Icon: CalendarDays },
    { href: "/presencial-bh", label: t("presencialBh"), Icon: MapPin },
    { href: "/sobre", label: t("sobre"), Icon: Info },
  ] as const;

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      {/* A gaveta abre por cima do header (z-index maior), então o botão
          fica coberto assim que abre — sem sentido animar ele pra virar X
          se ninguém vê. O X visível é só o de dentro da gaveta (SheetContent). */}
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        aria-label={aberto ? t("fecharMenu") : t("abrirMenu")}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(20rem,88vw)] flex-col">
        <SheetHeader>
          <SheetTitle className="titulo-display text-left text-xl">Quinto Dado</SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-1 flex-col gap-1.5 px-4">
          {/*
           * `both` (e não `backwards`) com atraso: o item nasce invisível e
           * aparece na cascata. Isso só é seguro porque a gaveta monta no
           * toque da pessoa — a página já está pintando. Em conteúdo de
           * primeira pintura o mesmo padrão deixou o /links invisível, então
           * lá a entrada é ligada à rolagem.
           */}
          {links.map(({ href, label, Icon }, i) => {
            const ativo = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                aria-current={ativo ? "page" : undefined}
                style={{ animationDelay: `${i * 45}ms` }}
                className={`motion-safe:animate-[menu-item-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both] flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors ${
                  ativo
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              className={buttonVariants({ variant: "marca", size: "lg", className: "w-full" })}
            >
              {t("entrar")}
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
