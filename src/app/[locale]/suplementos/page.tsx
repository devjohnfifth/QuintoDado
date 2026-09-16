import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_LINKS } from "@/lib/site-links";
import { Reveal } from "@/components/site/reveal";
import { SuplementoCard } from "@/components/site/suplemento-card";
import { listarSuplementos } from "@/lib/suplementos/publico";
import { TIPO_SUPLEMENTO, TIPOS_SUPLEMENTO, type TipoSuplemento } from "@/lib/suplementos/labels";
import emConstrucao from "@/assets/brand/em-construcao.svg";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Suplementos" });
  const title = t("metaTitulo");
  const description = t("metaDescricao");
  return {
    title,
    description,
    alternates: { canonical: "/suplementos" },
    openGraph: { title, description, locale, type: "website" },
  };
}

type Filtros = { sistema?: string; tipo?: string };

export default async function SuplementosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Filtros>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Suplementos");
  const sp = await searchParams;
  const filtros: Filtros = {
    sistema: sp.sistema || undefined,
    tipo: TIPOS_SUPLEMENTO.includes(sp.tipo as TipoSuplemento) ? sp.tipo : undefined,
  };

  // O catálogo é pequeno: busca tudo uma vez e filtra em memória, assim os
  // selects só oferecem sistema e tipo que têm material de verdade.
  const todos = await listarSuplementos();
  const suplementos = todos.filter(
    (s) => (!filtros.tipo || s.tipo === filtros.tipo) && (!filtros.sistema || s.sistemas?.slug === filtros.sistema),
  );
  const sistemas = [...new Map(todos.flatMap((s) => (s.sistemas ? [[s.sistemas.slug, s.sistemas]] : []))).values()].sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const tipos = TIPOS_SUPLEMENTO.filter((tp) => todos.some((s) => s.tipo === tp));
  const temFiltroAtivo = Boolean(filtros.sistema || filtros.tipo);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:max-w-5xl lg:px-[10vw]">
      <Reveal>
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
          <BookOpen className="size-5" aria-hidden />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">{t("titulo")}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitulo")}</p>
      </Reveal>

      {todos.length > 0 && (
        <Reveal className="mt-8">
          <form className="flex flex-wrap gap-3" aria-label={t("filtroLabel")}>
            {sistemas.length > 0 && (
              <select
                name="sistema"
                defaultValue={filtros.sistema ?? ""}
                aria-label={t("todosSistemas")}
                className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm"
              >
                <option value="">{t("todosSistemas")}</option>
                {sistemas.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.nome}
                  </option>
                ))}
              </select>
            )}
            <select
              name="tipo"
              defaultValue={filtros.tipo ?? ""}
              aria-label={t("todosTipos")}
              className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm"
            >
              <option value="">{t("todosTipos")}</option>
              {tipos.map((tp) => (
                <option key={tp} value={tp}>
                  {TIPO_SUPLEMENTO[tp].plural}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2 text-sm font-medium text-white"
            >
              {t("filtrar")}
            </button>
            {temFiltroAtivo && (
              <Link
                href="/suplementos"
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t("limpar")}
              </Link>
            )}
          </form>
        </Reveal>
      )}

      <Reveal className="mt-6">
        {suplementos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Image src={emConstrucao} alt="" className="mx-auto h-28 w-28" />
            <p className="mt-4 font-heading text-lg font-bold">
              {temFiltroAtivo ? t("semResultadoTitulo") : t("vazioTitulo")}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {temFiltroAtivo ? t("semResultadoCorpo") : t("vazioCorpo")}
            </p>
            {!temFiltroAtivo && (
              <a
                href={SITE_LINKS.whatsappComunidade}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
              >
                {t("cta")}
              </a>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suplementos.map((s) => (
              <li key={s.slug}>
                <SuplementoCard suplemento={s} />
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
