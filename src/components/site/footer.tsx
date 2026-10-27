import Image from "next/image";
import { useTranslations } from "next-intl";
// A lucide não traz mais ícones de marca, então cada rede usa o símbolo
// genérico mais próximo — a cor é que identifica.
import { Camera, Dices, MessageCircle, PlayCircle, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Container } from "@/components/site/container";
import logo5d from "@/assets/brand/logo-5d.png";

function Coluna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="rotulo-caps text-foreground/70">{titulo}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

const CLASSE_LINK = "text-muted-foreground transition-colors hover:text-foreground";

/** Cada rede com a cor dela: é o que tira o rodapé do cinza sem pedir arte nova. */
const COR_REDE: Record<string, string> = {
  whatsapp: "text-[#25D366]",
  instagram: "text-[#E1306C]",
  youtube: "text-[#FF0000]",
  mesaquest: "text-secondary",
};

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
  const externos: { chave: string; href: string; label: string; Icone: LucideIcon }[] = [
    { chave: "whatsapp", href: SITE_LINKS.whatsappComunidade, label: t("whatsapp"), Icone: MessageCircle },
    { chave: "instagram", href: SITE_LINKS.instagram, label: t("instagram"), Icone: Camera },
    { chave: "youtube", href: SITE_LINKS.youtube, label: t("youtube"), Icone: PlayCircle },
    { chave: "mesaquest", href: SITE_LINKS.mesaquest, label: t("mesaquest"), Icone: Dices },
  ];
  const legal = [
    { href: "/termos", label: t("termos") },
    { href: "/privacidade", label: t("privacidade") },
    { href: "/reembolso", label: t("reembolso") },
    { href: "/licenca-de-uso", label: t("licenca") },
  ];

  return (
    // O rodapé era texto cinza num fundo igual ao da página e sumia. Agora tem
    // superfície própria, trama de d20 e um fio de luz no topo, então fecha a
    // página em vez de só terminar.
    <footer id="rodape-site" className="borda-luz relative overflow-hidden border-t border-border/60 bg-superficie text-sm">
      <div aria-hidden className="textura-hex pointer-events-none absolute inset-0 opacity-[0.045]" />

      <Container className="relative py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-3">
              <Image
                src={logo5d}
                alt=""
                className="size-12 rounded-xl ring-1 ring-border transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
              />
              <span className="titulo-display text-marca text-2xl">Quinto Dado</span>
            </Link>
            <p className="mt-4 max-w-xs leading-relaxed text-muted-foreground">{t("tagline")}</p>
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
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex items-center gap-2 ${CLASSE_LINK}`}
                >
                  <l.Icone
                    className={`size-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${COR_REDE[l.chave]}`}
                    aria-hidden
                  />
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

        <div className="mt-12 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p className="max-w-3xl leading-relaxed">{t("avisoLegal")}</p>
          <p className="mt-3">{t("direitos", { ano: new Date().getFullYear() })}</p>
        </div>
      </Container>
    </footer>
  );
}
