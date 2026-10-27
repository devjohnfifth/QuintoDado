import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  MessageCircle,
  Dices,
  BookOpen,
  Camera,
  Music2,
  PlayCircle,
  MapPin,
  ArrowUpRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { SITE_LINKS } from "@/lib/site-links";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import logo5d from "@/assets/brand/logo-5d.png";
import mestreQuintao from "@/assets/brand/mestre-quintao.webp";

export const metadata: Metadata = {
  title: "Quinto Dado — Links",
  description:
    "Todos os links do Mestre Quintão: comunidade no WhatsApp, mesas abertas, suplementos gratuitos de RPG e redes sociais, em um só lugar.",
  alternates: { canonical: "/links" },
};

/**
 * TODO(Supabase): substituir por `select * from links where ativo order by ordem`
 * assim que o banco estiver plugado (ver docs/Modelo-de-Dados_QuintoDado_v1.sql).
 */
const linksEstaticos: {
  chave: string;
  href: string | null;
  Icon: LucideIcon;
  /** Cor da própria rede: é o que tira a lista do cinza sem pedir arte nova. */
  cor: string;
}[] = [
  { chave: "comunidade", href: SITE_LINKS.whatsappComunidade, Icon: MessageCircle, cor: "text-[#25D366]" },
  { chave: "mesas", href: SITE_LINKS.mesaquest, Icon: Dices, cor: "text-acento" },
  { chave: "suplementos", href: "/suplementos", Icon: BookOpen, cor: "text-primary" },
  { chave: "instagram", href: SITE_LINKS.instagram, Icon: Camera, cor: "text-[#E1306C]" },
  { chave: "tiktok", href: SITE_LINKS.tiktok, Icon: Music2, cor: "text-[#69C9D0]" },
  { chave: "youtube", href: SITE_LINKS.youtube, Icon: PlayCircle, cor: "text-[#FF0000]" },
  { chave: "presencialBh", href: "/presencial-bh", Icon: MapPin, cor: "text-secondary" },
];

export default async function LinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Links");

  const links = linksEstaticos.filter(
    (link): link is typeof link & { href: string } => Boolean(link.href),
  );
  const [primeiro, ...resto] = links;

  return (
    <>
      {/*
       * Link-in-bio é tela limpa: é a primeira página que o público do
       * Instagram vê, e header e rodapé do site só competem com os links.
       * O cromo mora no layout do locale (que serve todas as rotas), então em
       * vez de refatorar o layout inteiro em grupos de rota, esta página
       * esconde os dois pelos ids. Renderiza no servidor, então não pisca.
       */}
      <style>{`#cabecalho-site, #rodape-site { display: none; }`}</style>

      <div className="textura-grao relative isolate flex min-h-screen flex-col items-center overflow-hidden px-4 py-14 sm:px-6">
        <div
          aria-hidden
          className="brilho-marca pointer-events-none absolute inset-0 -z-20"
        />
        <D20MarcaDagua className="pointer-events-none absolute -right-20 top-10 -z-10 size-64 text-foreground/[0.025]" />
        <D20MarcaDagua className="pointer-events-none absolute -left-24 bottom-16 -z-10 size-56 text-foreground/[0.02]" />

        <div className="w-full max-w-sm">
          {/* Foto do Quintão com anel em gradiente: dá rosto à página, que
              antes abria com um logo de 64px e mais nada. */}
          <div
            className="mx-auto w-fit rounded-full bg-marca p-[3px]"
          >
            <Image
              src={mestreQuintao}
              alt=""
              priority
              className="size-28 rounded-full object-cover ring-4 ring-background"
            />
          </div>

          <div
            className="mt-5 flex items-center justify-center gap-2"
          >
            <Image src={logo5d} alt="" className="size-7 rounded-md" />
            <h1 className="titulo-display text-2xl">{t("titulo")}</h1>
          </div>

          <p
            className="mt-2 text-center text-sm text-muted-foreground"
          >
            {t("tagline")}
          </p>

          <nav className="cascata mt-9 flex w-full flex-col gap-3">
            {primeiro && (
              <a
                href={primeiro.href}
                target={primeiro.href.startsWith("http") ? "_blank" : undefined}
                rel={primeiro.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex transform-gpu items-center gap-3 rounded-xl bg-marca px-5 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_color-mix(in_oklch,var(--qd-secundaria)_80%,transparent)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
              >
                <primeiro.Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{t(primeiro.chave)}</span>
                <ArrowUpRight
                  className="size-4 shrink-0 opacity-80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            )}

            {resto.map(({ chave, href, Icon, cor }) => {
              const externo = href.startsWith("http");
              return (
                <a
                  key={chave}
                  href={href}
                  target={externo ? "_blank" : undefined}
                  rel={externo ? "noopener noreferrer" : undefined}
                  className="group elevar hover:elevar-hover flex transform-gpu items-center gap-3 rounded-xl painel px-5 py-4 text-sm font-medium"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <Icon className={`size-4 transition-transform duration-300 group-hover:scale-110 ${cor}`} aria-hidden />
                  </span>
                  <span className="flex-1">{t(chave)}</span>
                  {externo ? (
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Quinto Dado
          </p>
        </div>
      </div>
    </>
  );
}
