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
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <Users className="size-5 text-primary" aria-hidden />
          {t("abaElenco")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("visaoResumo", { entidades: entidades.length, sessoes: sessoes.length })}
        </p>
        {entidades.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {Object.entries(porTipo).map(([tipo, n]) => (
              <li key={tipo} className="rounded-full border border-border px-3 py-1 text-muted-foreground">
                {TIPO_ENTIDADE_LABEL[tipo as TipoEntidade]?.plural ?? tipo}: <span className="text-foreground">{n}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/mesas/${slug}/painel/elenco`}
          className={buttonVariants({ variant: "outline", className: "mt-5 rounded-full" })}
        >
          {t("abaElenco")}
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          {t("ultimaSessao")}
        </h2>
        {ultima ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("sessaoNumero", { n: ultima.numero })}
              {ultima.data ? ` · ${new Date(`${ultima.data}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}
            </p>
            {ultima.resumo_md && (
              <div className="mt-3 line-clamp-6 text-sm">
                <DescricaoMarkdown texto={ultima.resumo_md} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{t("semSessao")}</p>
        )}
        <Link
          href={`/mesas/${slug}/painel/sessoes`}
          className={buttonVariants({ variant: "outline", className: "mt-5 rounded-full" })}
        >
          {t("abaSessoes")}
        </Link>
      </section>
    </div>
  );
}
