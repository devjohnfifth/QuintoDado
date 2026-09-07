import { useTranslations } from "next-intl";
import { BookOpen, Dices, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Reveal } from "@/components/site/reveal";

export default function HomePage() {
  const t = useTranslations("Home");

  return (
    <>
      {/* Bloco 1 — herói */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: "80px 92px",
          }}
        />
        {/* Glows de marca — profundidade sutil, nunca competindo com o texto */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-[65%] rounded-full bg-[#4F7DF3]/25 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[24rem] w-[24rem] translate-x-[10%] rounded-full bg-[#A855F7]/20 blur-[110px]"
        />

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Dices className="size-3.5 text-primary" aria-hidden />
            {t("hero.eyebrow")}
          </span>

          <h1 className="mt-5 font-heading text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] bg-clip-text text-transparent">
              {t("hero.titulo")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {t("hero.subtitulo")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={SITE_LINKS.whatsappComunidade}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-6 py-3 text-center text-sm font-medium text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(139,92,246,0.55)] sm:w-auto"
            >
              {t("hero.ctaComunidade")}
            </a>
            <Link
              href="/mesas"
              className="w-full rounded-full border border-border px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
            >
              {t("hero.ctaMesas")}
            </Link>
          </div>
        </div>
      </section>

      {/* Bloco 3 — apresentação curta */}
      <Reveal className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl border-l-2 border-primary/40 pl-6">
          {t("apresentacao.corpo")
            .split("\n\n")
            .map((paragrafo, i) => (
              <p key={i} className="mt-4 text-muted-foreground first:mt-0">
                {paragrafo}
              </p>
            ))}
          <Link
            href="/sobre"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("apresentacao.ctaSobre")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Reveal>

      {/* Blocos 4 e 5 — suplementos e mesas, lado a lado pra quebrar a pilha vertical */}
      <Reveal className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="group rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
              <BookOpen className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold">
              {t("suplementos.titulo")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("suplementos.corpo")}
            </p>
            <Link
              href="/suplementos"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-primary"
            >
              {t("suplementos.cta")}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <div className="group rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
              <Dices className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold">{t("mesas.titulo")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("mesas.corpo")}</p>
            <Link
              href="/mesas"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-primary"
            >
              {t("mesas.cta")}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Bloco 6 — prova social entra quando depoimentos existirem no banco */}

      {/* Bloco 4' — comunidade */}
      <Reveal className="relative overflow-hidden border-t border-border/60 px-4 py-16 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#4F7DF3]/10 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
            <MessageCircle className="size-5" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">
            {t("comunidade.titulo")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("comunidade.corpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-6 py-3 text-sm font-medium text-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_rgba(139,92,246,0.55)]"
          >
            {t("comunidade.cta")}
          </a>
        </div>
      </Reveal>
    </>
  );
}
