import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";

export default function HomePage() {
  const t = useTranslations("Home");

  return (
    <>
      {/* Bloco 1 — herói */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: "80px 92px",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
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
              className="w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
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
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {t("apresentacao.corpo")
            .split("\n\n")
            .map((paragrafo, i) => (
              <p key={i} className="mt-4 text-muted-foreground first:mt-0">
                {paragrafo}
              </p>
            ))}
          <Link
            href="/sobre"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("apresentacao.ctaSobre")} →
          </Link>
        </div>
      </section>

      {/* Bloco 5 — últimos suplementos (dados reais entram quando o catálogo existir) */}
      <section className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-2xl font-bold">
            {t("suplementos.titulo")}
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {t("suplementos.corpo")}
          </p>
          <Link
            href="/suplementos"
            className="mt-6 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t("suplementos.cta")} →
          </Link>
        </div>
      </section>

      {/* Bloco 4 — mesas abertas (some quando não houver nenhuma publicada) */}
      <section className="border-t border-border/60 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-2xl font-bold">
            {t("mesas.titulo")}
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {t("mesas.corpo")}
          </p>
          <Link
            href="/mesas"
            className="mt-6 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t("mesas.cta")} →
          </Link>
        </div>
      </section>

      {/* Bloco 6 — prova social entra quando depoimentos existirem no banco */}

      {/* Bloco 4' — comunidade */}
      <section className="border-t border-border/60 bg-card/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold">
            {t("comunidade.titulo")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("comunidade.corpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("comunidade.cta")}
          </a>
        </div>
      </section>
    </>
  );
}
