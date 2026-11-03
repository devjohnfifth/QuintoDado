import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CIDADES_PRESENCIAIS, SLUG_CIDADE, type CidadePresencial } from "@/lib/mesas/cidades";

/**
 * Filtro de cidade da página presencial.
 *
 * São links de verdade, não botões com estado no cliente: cada cidade vira
 * um endereço que dá pra compartilhar, o robô de busca rastreia, e funciona
 * sem JS. Paginar junto com o filtro também sai de graça, porque a
 * `Paginacao` repassa a query.
 *
 * Cada chip carrega quantas mesas tem. Cidade sem mesa aparece apagada mas
 * continua clicável — esconder faria parecer que a cidade não é atendida,
 * quando o que falta é mesa publicada nela.
 */
export function FiltroCidades({
  contagem,
  selecionada,
  total,
}: {
  /** Quantas mesas por cidade, já contadas no servidor. */
  contagem: Record<string, number>;
  selecionada: CidadePresencial | null;
  total: number;
}) {
  const t = useTranslations("PresencialBh");

  const classe = (ativo: boolean, vazio: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
      ativo
        ? "border-primary/60 bg-primary/15 text-primary"
        : `border-border painel hover:border-primary/40 hover:text-foreground ${
            vazio ? "text-muted-foreground/60" : "text-muted-foreground"
          }`
    }`;

  return (
    <nav aria-label={t("filtroLabel")} className="flex flex-wrap gap-2">
      <Link href="/presencial" aria-current={!selecionada ? "page" : undefined} className={classe(!selecionada, false)}>
        <MapPin className="size-4 shrink-0" aria-hidden />
        {t("todasCidades")}
        <span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums">{total}</span>
      </Link>

      {CIDADES_PRESENCIAIS.map((cidade) => {
        const n = contagem[cidade] ?? 0;
        const ativo = selecionada === cidade;
        return (
          <Link
            key={cidade}
            href={{ pathname: "/presencial", query: { cidade: SLUG_CIDADE[cidade] } }}
            aria-current={ativo ? "page" : undefined}
            className={classe(ativo, n === 0)}
          >
            {cidade}
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${ativo ? "bg-primary/25" : "bg-foreground/10"}`}
            >
              {n}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
