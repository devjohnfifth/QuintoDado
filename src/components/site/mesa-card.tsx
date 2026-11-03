import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle2, ExternalLink, Flame, Globe, MapPin, Repeat, Clock, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import { CLASSIFICACAO_LABEL, FREQUENCIA_LABEL, NIVEL_LABEL, TIPO_MESA_LABEL } from "@/lib/mesas/labels";
import { diasParaComeco } from "@/lib/mesas/horario";
import { FundoSemImagem } from "@/components/site/card-midia";
import { Selo } from "@/components/site/selo";
import { CadeirasVagas } from "@/components/site/cadeiras-vagas";
import { BrilhoCursor } from "@/components/site/brilho-cursor";
import { corDoSistema } from "@/lib/mesas/cores-sistemas";
import type { SituacaoNaMesa } from "@/lib/mesas/minhas-inscricoes";

export type MesaCardData = {
  sistema_id?: string | null;
  id?: string;
  slug: string;
  titulo: string;
  sinopse?: string | null;
  tipo?: string | null;
  modalidade: "online" | "presencial";
  cidade_uf: string | null;
  classificacao: string;
  nivel_experiencia: string;
  preco_centavos: number;
  frequencia: string;
  qtd_sessoes?: number | null;
  data_inicio: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_total: number;
  min_jogadores: number;
  vagas_preenchidas: number;
  banner_url: string | null;
  link_externo?: string | null;
  sistemas: { nome: string; slug: string } | null;
  sistema_outro: string | null;
  jogadores_aprovados: { nome: string; avatar_url: string | null }[] | null;
  profiles?: { nome_exibicao: string; avatar_url: string | null } | null;
  eventos?: { titulo: string } | null;
};

/** Domínio do site externo, pro rótulo do botão ("Abrir no MesaQuest"). */
function nomeDoSite(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return null;
  }
}

/**
 * Card de mesa, formato dossiê.
 *
 * Horizontal: capa em retrato à esquerda com a data colada nela, e à direita
 * tudo que decide se a mesa serve pra quem está lendo — sistema, tipo, um fio
 * de sinopse, classificação, nível, cadeiras e a ação.
 *
 * Por que não é um `<Link>` por fora: o card tem um botão próprio, e botão
 * dentro de link é HTML inválido e vira dois destinos sobrepostos no leitor
 * de tela. Em vez disso o TÍTULO é o link e se estende por cima do card
 * inteiro (`after:absolute after:inset-0`). O botão de ação é decorativo pro
 * leitor de tela (`aria-hidden`), porque leva ao mesmo lugar do título — ele
 * existe pra deixar claro onde clicar, não pra ser um segundo destino.
 */
export function MesaCard({
  mesa,
  favorito = false,
  situacao,
}: {
  mesa: MesaCardData;
  favorito?: boolean;
  /** Onde a pessoa logada está nesta mesa, se estiver. */
  situacao?: SituacaoNaMesa;
}) {
  const t = useTranslations("MesaCard");
  const cor = corDoSistema(mesa.sistemas?.slug);
  const nomeSistema = mesa.sistema_outro || mesa.sistemas?.nome || "—";
  const dias = diasParaComeco(mesa.data_inicio);
  const vagasLivres = mesa.vagas_total - mesa.vagas_preenchidas;
  const lotada = vagasLivres <= 0;
  const faltamPraAbrir = mesa.min_jogadores - mesa.vagas_preenchidas;
  const siteExterno = mesa.link_externo ? nomeDoSite(mesa.link_externo) : null;

  const data = new Date(`${mesa.data_inicio}T00:00:00`);
  const semPonto = (txt: string) => txt.replace(".", "");
  const diaSemana = semPonto(data.toLocaleDateString("pt-BR", { weekday: "short" }));
  const diaNumero = data.toLocaleDateString("pt-BR", { day: "2-digit" });
  const mesCurto = semPonto(data.toLocaleDateString("pt-BR", { month: "short" }));
  // Uma sessão única "acontece"; o que tem continuação "começa".
  const quando = mesa.frequencia === "unica" ? t("acontece") : t("comeca");

  const local = mesa.modalidade === "presencial" && mesa.cidade_uf ? mesa.cidade_uf : null;
  const frequencia = FREQUENCIA_LABEL[mesa.frequencia] ?? mesa.frequencia;
  const sessoes = mesa.qtd_sessoes ? ` · ${t("sessoes", { n: mesa.qtd_sessoes })}` : "";

  const classeBotao =
    "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-[1.03] active:scale-95";

  return (
    <article className="group painel elevar hover:elevar-hover relative flex flex-col overflow-hidden rounded-2xl sm:flex-row">
      {/* Capa em retrato, com o adesivo de data colado nela. */}
      <div
        className={`relative h-32 w-full shrink-0 overflow-hidden sm:h-auto sm:w-36 ${
          lotada ? "opacity-60 saturate-50" : ""
        }`}
      >
        {mesa.banner_url ? (
          <Image
            src={mesa.banner_url}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 640px) 144px, 100vw"
          />
        ) : (
          <FundoSemImagem chave={mesa.slug} />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {mesa.eventos && (
          <span className="absolute inset-x-2 top-2">
            <Selo tom="imagem">{mesa.eventos.titulo}</Selo>
          </span>
        )}
        {!lotada && !mesa.eventos && dias >= 0 && dias <= 14 && (
          <span className="absolute inset-x-2 top-2">
            <Selo tom="imagem" icone={Flame}>
              {dias === 0 ? t("hoje") : t("emDias", { n: dias })}
            </Selo>
          </span>
        )}

        <div className="painel-alto absolute bottom-2 left-2 w-14 rounded-xl py-1.5 text-center">
          <span className="rotulo-caps block text-[0.6rem] text-muted-foreground">{diaSemana}</span>
          <span className="titulo-display block text-xl leading-tight">{diaNumero}</span>
          <span className="rotulo-caps block text-[0.6rem] text-muted-foreground">{mesCurto}</span>
          <span className="rotulo-caps mt-1 block border-t border-border/60 pt-1 text-[0.55rem] text-muted-foreground">
            {quando}
          </span>
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-4 ${lotada ? "opacity-70" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-medium" style={{ color: cor }}>
            {nomeSistema}
            {mesa.tipo ? ` · ${TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}` : ""}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {favorito && (
              <Selo tom="alerta" icone={Star}>
                {t("favorito")}
              </Selo>
            )}
            {situacao ? (
              <Selo tom="marca" icone={CheckCircle2}>
                {situacao === "aprovado" ? t("confirmadoNaMesa") : t("candidaturaEnviada")}
              </Selo>
            ) : lotada ? (
              <Selo tom="neutro">{t("lotada")}</Selo>
            ) : vagasLivres === 1 ? (
              <Selo tom="erro">{t("ultimaVaga")}</Selo>
            ) : (
              <Selo tom={mesa.preco_centavos === 0 ? "sucesso" : "marca"}>
                {mesa.preco_centavos === 0 ? t("gratuita") : formatBRL(mesa.preco_centavos)}
              </Selo>
            )}
          </div>
        </div>

        <h3 className="titulo-display titulo-bloco mt-1.5">
          <Link
            href={`/mesas/${mesa.slug}`}
            className="outline-offset-4 transition-colors after:absolute after:inset-0 group-hover:text-primary"
          >
            {mesa.titulo}
          </Link>
        </h3>

        {mesa.sinopse && <p className="mt-1 truncate text-sm text-muted-foreground">{mesa.sinopse}</p>}

        <dl className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-3 text-sm text-muted-foreground">
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
            <dd className="truncate">{local ?? "Online"}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("frequencia")}</dt>
            <Repeat className="size-4 shrink-0 text-primary" aria-hidden />
            <dd>
              {frequencia}
              {sessoes}
            </dd>
          </div>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-xs">
            {CLASSIFICACAO_LABEL[mesa.classificacao] ?? mesa.classificacao}
          </span>
          <span className="rounded-md border border-border px-1.5 py-0.5 text-xs">
            {NIVEL_LABEL[mesa.nivel_experiencia] ?? mesa.nivel_experiencia}
          </span>
        </dl>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <CadeirasVagas
              total={mesa.vagas_total}
              preenchidas={mesa.vagas_preenchidas}
              jogadores={mesa.jogadores_aprovados ?? []}
            />
            {/* "Faltam N pra confirmar" é o convite mais forte que a mesa tem:
                diz que a vaga de quem lê é a que destrava o jogo. */}
            {!lotada && faltamPraAbrir > 0 ? (
              <p className="text-alerta mt-1.5 text-sm">{t("faltamPraConfirmar", { n: faltamPraAbrir })}</p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("vagasRestantes", {
                  preenchidas: mesa.vagas_preenchidas,
                  total: mesa.vagas_total,
                  n: Math.max(0, vagasLivres),
                })}
              </p>
            )}
            {mesa.profiles?.nome_exibicao && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {mesa.profiles.avatar_url ? (
                  <Image
                    src={mesa.profiles.avatar_url}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-5 items-center justify-center rounded-full bg-marca text-[0.6rem] font-bold text-white">
                    {mesa.profiles.nome_exibicao.charAt(0).toUpperCase()}
                  </span>
                )}
                {t("mestradoPor", { nome: mesa.profiles.nome_exibicao })}
              </p>
            )}
          </div>

          {mesa.link_externo ? (
            <a
              href={mesa.link_externo}
              target="_blank"
              rel="noopener noreferrer"
              className={`${classeBotao} border border-border hover:border-primary/40`}
            >
              <ExternalLink className="size-4" aria-hidden />
              {siteExterno ? t("ctaExterno", { site: siteExterno }) : t("ctaVerMesa")}
            </a>
          ) : (
            <Link
              href={`/mesas/${mesa.slug}`}
              tabIndex={-1}
              aria-hidden
              className={
                situacao || lotada
                  ? `${classeBotao} border border-border text-muted-foreground hover:border-primary/40`
                  : `${classeBotao} bg-marca text-white`
              }
            >
              {situacao ? t("ctaMinhaCandidatura") : lotada ? t("ctaVerMesa") : t("ctaEntrar")}
            </Link>
          )}
        </div>
      </div>

      <BrilhoCursor cor={cor} />
    </article>
  );
}
