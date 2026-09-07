import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import logo5d from "@/assets/brand/logo-5d.png";

export function SiteHeader() {
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
        >
          <Image src={logo5d} alt="" priority className="h-8 w-8 rounded-md" />
          <span className="bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] bg-clip-text text-transparent">
            Quinto Dado
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/suplementos" className="hover:text-foreground">
            {t("suplementos")}
          </Link>
          <Link href="/mesas" className="hover:text-foreground">
            {t("mesas")}
          </Link>
          <Link href="/presencial-bh" className="hover:text-foreground">
            {t("presencialBh")}
          </Link>
          <Link href="/sobre" className="hover:text-foreground">
            {t("sobre")}
          </Link>
          <Link href="/links" className="hover:text-foreground">
            {t("links")}
          </Link>
        </nav>

        <Link
          href="/entrar"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("entrar")}
        </Link>
      </div>
    </header>
  );
}
