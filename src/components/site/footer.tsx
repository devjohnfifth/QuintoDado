import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("Rodape");

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-[10vw]">
        <p className="max-w-2xl">{t("avisoLegal")}</p>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/termos" className="hover:text-foreground">
            {t("termos")}
          </Link>
          <Link href="/privacidade" className="hover:text-foreground">
            {t("privacidade")}
          </Link>
          <Link href="/reembolso" className="hover:text-foreground">
            {t("reembolso")}
          </Link>
          <Link href="/licenca-de-uso" className="hover:text-foreground">
            {t("licenca")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
