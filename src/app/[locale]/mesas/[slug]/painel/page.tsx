import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { DescricaoMarkdown } from "@/components/site/descricao-markdown";
import { acessoAoPainel } from "@/lib/painel/acesso";
import { listarEntidades, listarSessoes } from "@/lib/painel/dados";
import { TIPO_ENTIDADE_LABEL, type TipoEntidade } from "@/lib/painel/tipos";

export default async function PainelVisaoGeralPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Painel");

  const acesso = await acessoAoPainel(slug);
  if (!acesso) notFound();

  const [entidades, sessoes] = await Promise.all([listarEntidades(acesso.mesa.id), listarSessoes(acesso.mesa.id)]);
  const ultima = sessoes[0];

  // Contagem por tipo só do que esta pessoa pode ver — vem assim do RLS.
  const porTipo = entidades.reduce<Record<string, number>>((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="flex flex-col rounded-2xl painel p-6">
        <p className="rotulo-caps flex items-center gap-2 text-muted-foreground">
          <Users className="size-4 text-acento" aria-hidden />
          {t("abaElenco")}
        </p>
        {/* O número primeiro, grande: é o que a pessoa quer saber de relance. */}
        <p className="titulo-display mt-3 text-5xl text-acento tabular-nums">{entidades.length}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("visaoResumo", { entidades: entidades.length, sessoes: sessoes.length })}
        </p>
        {entidades.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            {Object.entries(porTipo).map(([tipo, n]) => (
              <li key={tipo} className="rounded-full border border-border px-3 py-1 text-muted-foreground">
                {TIPO_ENTIDADE_LABEL[tipo as TipoEntidade]?.plural ?? tipo}:{" "}
                <span className="font-medium text-foreground tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/mesas/${slug}/painel/elenco`}
          className={buttonVariants({ variant: "outline", className: "mt-6 self-start rounded-full" })}
        >
          {t("abaElenco")}
        </Link>
      </section>

      <section className="flex flex-col rounded-2xl painel p-6">
        <p className="rotulo-caps flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 text-acento" aria-hidden />
          {t("ultimaSessao")}
        </p>
        {ultima ? (
          <>
            <p className="titulo-display titulo-bloco mt-3 text-acento">
              {t("sessaoNumero", { n: ultima.numero })}
            </p>
            {ultima.data && (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(`${ultima.data}T00:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
            )}
            {ultima.resumo_md && (
              <div className="mt-4 line-clamp-6 border-l-2 border-border pl-4 text-sm text-muted-foreground">
                <DescricaoMarkdown texto={ultima.resumo_md} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("semSessao")}</p>
        )}
        <Link
          href={`/mesas/${slug}/painel/sessoes`}
          className={buttonVariants({ variant: "outline", className: "mt-6 self-start rounded-full" })}
        >
          {t("abaSessoes")}
        </Link>
      </section>
    </div>
  );
}
