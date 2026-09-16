import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Container } from "@/components/site/container";
import logo5d from "@/assets/brand/logo-5d.png";

function Coluna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-heading text-sm font-bold text-foreground">{titulo}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

const CLASSE_LINK = "text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter() {
  const t = useTranslations("Rodape");
  const nav = useTranslations("Nav");

  // `/links` fica fora de propósito: é a página de link-in-bio, não uma seção do site.
  const explorar = [
    { href: "/suplementos", label: nav("suplementos") },
    { href: "/mesas", label: nav("mesas") },
    { href: "/eventos", label: nav("eventos") },
    { href: "/presencial-bh", label: nav("presencialBh") },
    { href: "/sobre", label: nav("sobre") },
  ];
  const externos = [
    { href: SITE_LINKS.whatsappComunidade, label: t("whatsapp") },
    { href: SITE_LINKS.instagram, label: t("instagram") },
    { href: SITE_LINKS.youtube, label: t("youtube") },
    { href: SITE_LINKS.mesaquest, label: t("mesaquest") },
  ];
  const legal = [
    { href: "/termos", label: t("termos") },
    { href: "/privacidade", label: t("privacidade") },
    { href: "/reembolso", label: t("reembolso") },
    { href: "/licenca-de-uso", label: t("licenca") },
  ];

  return (
    <footer className="border-t border-border/60 bg-background text-sm">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-bold">
              <Image src={logo5d} alt="" className="size-8 rounded-md" />
              <span className="text-marca">Quinto Dado</span>
            </Link>
            <p className="mt-3 max-w-xs text-muted-foreground">{t("tagline")}</p>
          </div>

          <nav aria-label={t("explorar")}>
            <Coluna titulo={t("explorar")}>
              {explorar.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={CLASSE_LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </Coluna>
          </nav>

          <Coluna titulo={t("comunidade")}>
            {externos.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={CLASSE_LINK}>
                  {l.label}
                </a>
              </li>
            ))}
          </Coluna>

          <nav aria-label={t("legal")}>
            <Coluna titulo={t("legal")}>
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={CLASSE_LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </Coluna>
          </nav>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p className="max-w-3xl leading-relaxed">{t("avisoLegal")}</p>
          <p className="mt-3">{t("direitos", { ano: new Date().getFullYear() })}</p>
        </div>
      </Container>
    </footer>
  );
}
