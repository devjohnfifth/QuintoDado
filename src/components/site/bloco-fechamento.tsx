import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Dices, Info, MapPin, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { buttonVariants } from "@/components/ui/button";

/**
 * Catálogo de caminhos. A página escolhe quais mostrar pela chave, então o
 * texto fica num lugar só e cada lista termina oferecendo o que faz sentido
 * depois dela.
 */
const CAMINHOS = {
  mesas: { href: "/mesas", Icone: Dices, externo: false },
  suplementos: { href: "/suplementos", Icone: BookOpen, externo: false },
  eventos: { href: "/eventos", Icone: CalendarDays, externo: false },
  presencial: { href: "/presencial-bh", Icone: MapPin, externo: false },
  mesaquest: { href: SITE_LINKS.mesaquest, Icone: ArrowUpRight, externo: true },
  sobre: { href: "/sobre", Icone: Info, externo: false },
} as const;

export type CaminhoFechamento = keyof typeof CAMINHOS;

/**
 * Fechamento de página.
 *
 * As listagens acabavam na grade e sobrava meia tela preta até o rodapé —
 * o que mais fazia o site parecer vazio. Aqui toda página termina com dois
 * ou três caminhos e o convite pra comunidade, que é o objetivo desta fase.
 */
export function BlocoFechamento({ caminhos }: { caminhos: CaminhoFechamento[] }) {
  const t = useTranslations("Fechamento");

  return (
    <Reveal className="relative border-t border-border/60 py-16 sm:py-20">
      <Container>
        <p className="rotulo-caps text-muted-foreground">{t("rotulo")}</p>
        <h2 className="titulo-display titulo-secao mt-2">{t("titulo")}</h2>

        <ul className="cascata mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caminhos.map((chave) => {
            const { href, Icone, externo } = CAMINHOS[chave];
            const conteudo = (
              <>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-300 group-hover:bg-primary/25">
                  <Icone className="size-5" aria-hidden />
                </span>
                <span className="mt-4 block font-heading text-lg font-bold">{t(`${chave}.titulo`)}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t(`${chave}.corpo`)}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {t(`${chave}.cta`)}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </>
            );
            const classe = "group elevar hover:elevar-hover block h-full rounded-2xl painel p-5";

            return (
              <li key={chave}>
                {externo ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
                    {conteudo}
                  </a>
                ) : (
                  <Link href={href} className={classe}>
                    {conteudo}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="brilho-marca textura-grao relative mt-6 overflow-hidden rounded-3xl border border-primary/30 px-6 py-10 text-center sm:px-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-marca text-white">
            <MessageCircle className="size-6" aria-hidden />
          </div>
          <h3 className="titulo-display titulo-bloco mt-4">{t("comunidadeTitulo")}</h3>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{t("comunidadeCorpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "marca", size: "lg", className: "mt-6" })}
          >
            {t("comunidadeCta")}
          </a>
        </div>
      </Container>
    </Reveal>
  );
}
