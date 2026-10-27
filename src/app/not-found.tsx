import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Inter, Space_Grotesk } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, BookOpen, Dices } from "lucide-react";
import { routing } from "@/i18n/routing";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = { title: "Página não encontrada — Quinto Dado", robots: { index: false } };

/**
 * 404 de endereço que não casa com rota nenhuma (ex.: /qualquer-coisa).
 *
 * Esses pedidos nem chegam no layout de `[locale]`, então o Next caía no 404
 * preto-e-branco dele — o visitante via uma página que não parecia do site.
 * Como aqui não há layout pai, esta página monta o próprio documento.
 *
 * O 404 de dentro do site (mesa ou suplemento que não existe) continua em
 * `[locale]/not-found.tsx`, com header e rodapé.
 */
export default async function NaoEncontradoGlobal() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "Erro" });

  return (
    <html lang={routing.defaultLocale} className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${bricolage.variable} antialiased`}>
        <main className="textura-grao relative isolate flex min-h-screen items-center overflow-hidden">
          <D20MarcaDagua className="pointer-events-none absolute -right-20 top-0 -z-10 size-[26rem] text-foreground/[0.04]" />
          <D20MarcaDagua className="pointer-events-none absolute -left-24 bottom-0 -z-10 size-80 text-foreground/[0.03]" />
          <div aria-hidden className="halo-marca pointer-events-none absolute inset-x-0 top-0 -z-20 h-[26rem]" />

          <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-erro/40 bg-erro/10">
              <span className="titulo-display text-3xl text-erro">1</span>
            </div>
            <p className="rotulo-caps mt-6 text-muted-foreground">{t("naoEncontradoRolou")}</p>
            <p className="titulo-display titulo-hero text-marca">404</p>
            <h1 className="titulo-display titulo-secao mt-2">{t("naoEncontradoTitulo")}</h1>
            <p className="mx-auto mt-3 max-w-md text-lg text-foreground/80">{t("naoEncontradoCorpo")}</p>

            {/* `Link` do next/link, não o do next-intl: fora de `[locale]`
                não há contexto de locale pra ele resolver o caminho. Como
                pt-BR é o padrão e vai sem prefixo, os endereços batem. */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-marca px-6 font-medium text-white"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {t("naoEncontradoCta")}
              </Link>
              <Link
                href="/mesas"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 font-medium transition-colors hover:border-primary/40"
              >
                <Dices className="size-4" aria-hidden />
                {t("naoEncontradoMesas")}
              </Link>
              <Link
                href="/suplementos"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 font-medium transition-colors hover:border-primary/40"
              >
                <BookOpen className="size-4" aria-hidden />
                {t("naoEncontradoSuplementos")}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
