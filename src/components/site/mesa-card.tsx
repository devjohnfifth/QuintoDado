import Image from "next/image";
import { useTranslations } from "next-intl";
import { Globe, MapPin, Repeat, Calendar, Clock, Flame, UserPlus, Lock, Star, CalendarDays, Dices } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import { MODALIDADE_LABEL, FREQUENCIA_LABEL } from "@/lib/mesas/labels";
import { diaSemanaAbreviado, diasParaComeco } from "@/lib/mesas/horario";
import { LOGO_SISTEMA } from "@/lib/mesas/logos-sistemas";
import { FundoSemImagem } from "@/components/site/card-midia";
import { Selo } from "@/components/site/selo";
import { CadeirasVagas } from "@/components/site/cadeiras-vagas";

export type MesaCardData = {
  sistema_id?: string | null;
  slug: string;
  titulo: string;
  modalidade: "online" | "presencial";
  cidade_uf: string | null;
  classificacao: string;
  nivel_experiencia: string;
  preco_centavos: number;
  frequencia: string;
  data_inicio: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_total: number;
  min_jogadores: number;
  vagas_preenchidas: number;
  banner_url: string | null;
  sistemas: { nome: string; slug: string } | null;
  sistema_outro: string | null;
  jogadores_aprovados: { nome: string; avatar_url: string | null }[] | null;
  eventos?: { titulo: string } | null;
};

/**
 * Card de mesa com cara de ingresso: o banner em cima (inteiro — a arte já
 * traz o nome da mesa, então não sobrepomos texto), a linha picotada com as
 * duas mordidas, e o "talão" com as informações embaixo.
 */
export function MesaCard({
  mesa,
  favorito = false,
  destaque = false,
}: {
  mesa: MesaCardData;
  favorito?: boolean;
  /** Lista com uma mesa só: vira horizontal a partir do `sm` (banner à esquerda, picote vertical). */
  destaque?: boolean;
}) {
  const t = useTranslations("MesaCard");
  const logo = mesa.sistemas ? LOGO_SISTEMA[mesa.sistemas.slug] : undefined;
  const nomeSistema = mesa.sistema_outro || mesa.sistemas?.nome || "—";
  const dias = diasParaComeco(mesa.data_inicio);
  const faltamPraAbrir = mesa.min_jogadores - mesa.vagas_preenchidas;
  const vagasLivres = mesa.vagas_total - mesa.vagas_preenchidas;
  const lotada = vagasLivres <= 0;
  const ultimaVaga = !lotada && vagasLivres === 1;
  const data = new Date(`${mesa.data_inicio}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <Link
      href={`/mesas/${mesa.slug}`}
      className={`group flex h-full flex-col transition-transform duration-300 hover:-translate-y-0.5 ${destaque ? "sm:flex-row" : ""}`}
    >
      {/* Canhoto: o banner. */}
      <div
        className={`relative aspect-[21/9] w-full shrink-0 overflow-hidden rounded-t-2xl border-x border-t border-border bg-card transition-colors duration-300 group-hover:border-primary/40 ${
          destaque ? "sm:aspect-auto sm:w-1/2 sm:rounded-l-2xl sm:rounded-tr-none sm:border-y sm:border-l sm:border-r-0" : ""
        }`}
      >
        {mesa.banner_url ? (
          <Image
            src={mesa.banner_url}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={destaque ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 330px, (min-width: 640px) 45vw, 100vw"}
          />
        ) : (
          <FundoSemImagem icone={Dices} chave={mesa.slug} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        <div className="absolute inset-x-2.5 top-2.5 flex flex-wrap gap-1.5">
          {mesa.eventos && (
            <Selo tom="solido" icone={CalendarDays}>
              {t("evento")}
            </Selo>
          )}
          {lotada ? (
            <Selo tom="imagem" icone={Lock}>
              {t("lotada")}
            </Selo>
          ) : (
            <>
              {dias >= 0 && dias <= 14 && (
                <Selo tom="imagem" icone={Flame} className="text-alerta">
                  {dias === 0 ? t("hoje") : t("emDias", { n: dias })}
                </Selo>
              )}
              {ultimaVaga ? (
                <Selo tom="erro" icone={UserPlus} className="bg-erro text-white motion-safe:animate-pulse">
                  {t("ultimaVaga")}
                </Selo>
              ) : (
                faltamPraAbrir > 0 && (
                  <Selo tom="imagem" icone={UserPlus}>
                    {t("faltamPraAbrir", { n: faltamPraAbrir })}
                  </Selo>
                )
              )}
            </>
          )}
        </div>

      </div>

      {/* Picote: linha tracejada entre duas mordidas (círculos da cor do fundo por cima da borda). */}
      <div aria-hidden className={`relative h-0 ${destaque ? "sm:h-auto sm:w-0" : ""}`}>
        <span className={`absolute -left-3 -top-3 z-10 size-6 rounded-full bg-background`} />
        <span
          className={`absolute -right-3 -top-3 z-10 size-6 rounded-full bg-background ${destaque ? "sm:-bottom-3 sm:right-[-12px] sm:top-auto" : ""}`}
        />
        <span
          className={`absolute inset-x-4 top-0 border-t-2 border-dashed border-border/70 ${
            destaque ? "sm:bottom-4 sm:left-0 sm:right-auto sm:top-4 sm:border-l-2 sm:border-t-0" : ""
          }`}
        />
      </div>

      {/* Talão: as informações. */}
      <div
        className={`flex flex-1 flex-col rounded-b-2xl border-x border-b border-border bg-card/60 p-4 transition-colors duration-300 group-hover:border-primary/40 ${
          destaque ? "sm:rounded-r-2xl sm:rounded-bl-none sm:border-y sm:border-l-0 sm:border-r sm:p-6" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {logo && (
              <span className="relative h-6 w-16 shrink-0 overflow-hidden rounded bg-white">
                <Image src={logo} alt="" fill className="object-cover" sizes="64px" />
              </span>
            )}
            <span className="truncate text-sm text-muted-foreground">{nomeSistema}</span>
          </div>
          {favorito && (
            <Selo tom="alerta" icone={Star}>
              {t("favorito")}
            </Selo>
          )}
        </div>

        <h3
          className={`mt-2 font-heading font-bold leading-tight transition-colors group-hover:text-primary ${destaque ? "text-2xl" : "text-lg"}`}
        >
          {mesa.titulo}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <CadeirasVagas
            total={mesa.vagas_total}
            preenchidas={mesa.vagas_preenchidas}
            jogadores={mesa.jogadores_aprovados ?? []}
          />
          <Selo tom={mesa.preco_centavos === 0 ? "sucesso" : "marca"} className="shrink-0">
            {mesa.preco_centavos === 0 ? t("gratuita") : formatBRL(mesa.preco_centavos)}
          </Selo>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("data")}</dt>
            <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
            <dd>
              <span className="font-medium text-foreground">{diaSemanaAbreviado(mesa.data_inicio)}</span>, {data}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("horario")}</dt>
            <Clock className="size-4 shrink-0 text-primary" aria-hidden />
            <dd>
              {mesa.horario_inicio.slice(0, 5)}–{mesa.horario_fim.slice(0, 5)}
            </dd>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <dt className="sr-only">{t("modalidade")}</dt>
            {mesa.modalidade === "online" ? (
              <Globe className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            )}
            <dd className="truncate">
              {mesa.modalidade === "presencial" && mesa.cidade_uf ? mesa.cidade_uf : MODALIDADE_LABEL[mesa.modalidade]}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("frequencia")}</dt>
            <Repeat className="size-4 shrink-0 text-primary" aria-hidden />
            <dd>{FREQUENCIA_LABEL[mesa.frequencia] ?? mesa.frequencia}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
