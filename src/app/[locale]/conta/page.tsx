import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Dices, MessageCircle, Sparkles, Ticket, Wand2 } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { meusDadosPessoais } from "@/lib/auth/dados-pessoais";
import { SITE_LINKS } from "@/lib/site-links";
import { Button, buttonVariants } from "@/components/ui/button";
import { mesaVisivelParaODono } from "@/lib/mesas/cancelamento";
import { Container } from "@/components/site/container";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { PerfilSection } from "@/components/site/perfil-section";
import { TrocarSenhaForm } from "@/components/site/trocar-senha-form";
import { CancelarMesaMestreButton } from "./cancelar-mesa-mestre-button";
import { AprovarMesaAdminButton } from "./aprovar-mesa-admin-button";
import { sairAction } from "../entrar/actions";

const STATUS_MESA_CANCELAVEL = ["aguardando_aprovacao", "publicada", "confirmada", "em_andamento"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Conta");
  return { title: t("metaTitulo"), robots: { index: false } };
}

/* Status → chave de tradução. Os mapas de cor ficam como estão: classe de
   CSS não é texto de interface. */
const STATUS_CHAVE: Record<string, string> = {
  candidatura_enviada: "inscricaoCandidaturaEnviada",
  aguardando_pagamento: "inscricaoAguardandoPagamento",
  pago_em_analise: "inscricaoPagoEmAnalise",
  aprovado: "inscricaoAprovado",
  recusado: "inscricaoRecusado",
  expirada: "inscricaoExpirada",
  cancelada_jogador: "inscricaoCanceladaJogador",
  cancelada_mestre: "inscricaoCanceladaMestre",
  reembolsada: "inscricaoReembolsada",
  concluida: "inscricaoConcluida",
};

const STATUS_COR: Record<string, string> = {
  aprovado: "border-sucesso/40 text-sucesso",
  concluida: "border-sucesso/40 text-sucesso",
  recusado: "border-destructive/40 text-destructive",
  cancelada_jogador: "border-border text-muted-foreground",
  cancelada_mestre: "border-destructive/40 text-destructive",
  expirada: "border-border text-muted-foreground",
  reembolsada: "border-border text-muted-foreground",
};

const STATUS_MESA_CHAVE: Record<string, string> = {
  rascunho: "mesaRascunho",
  aguardando_aprovacao: "mesaAguardandoAprovacao",
  publicada: "mesaPublicada",
  confirmada: "mesaConfirmada",
  em_andamento: "mesaEmAndamento",
  concluida: "mesaConcluida",
  cancelada: "mesaCancelada",
};

const STATUS_MESA_COR: Record<string, string> = {
  aguardando_aprovacao: "border-primary/40 text-primary",
  publicada: "border-sucesso/40 text-sucesso",
  confirmada: "border-sucesso/40 text-sucesso",
  em_andamento: "border-sucesso/40 text-sucesso",
  cancelada: "border-destructive/40 text-destructive",
};

const STATUS_INGRESSO_CHAVE: Record<string, string> = {
  pendente: "ingressoPendente",
  aprovado: "ingressoAprovado",
  recusado: "ingressoRecusado",
  cancelado: "ingressoCancelado",
};

const STATUS_INGRESSO_COR: Record<string, string> = {
  aprovado: "border-sucesso/40 text-sucesso",
  recusado: "border-destructive/40 text-destructive",
  cancelado: "border-border text-muted-foreground",
};

/** Título de seção da conta — um só, porque a página tinha dois. */
function TituloSecao({ children, acao }: { children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="titulo-display titulo-secao">{children}</h2>
      {acao}
    </div>
  );
}

export default async function ContaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Conta");

  if (!isSupabaseConfigured()) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  // Nome civil e telefone vêm pela função `meus_dados_pessoais()`: desde a
  // migration 20261115210000 essas colunas não são legíveis pelas chaves
  // públicas, porque `profiles` precisa ser lido publicamente (nome de
  // exibição e avatar) e isso arrastava junto o dado pessoal de todo mundo.
  const [{ data: perfil }, pessoais, { data: sistemas }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, nome_exibicao, avatar_url, papel, bio, sistemas_favoritos, perfil_publico, mestre_solicitado_em")
      .eq("id", user.id)
      .single(),
    meusDadosPessoais(supabase),
    // "Outro" não faz sentido como sistema favorito fixo — só existe pra
    // deixar quem cria mesa apontar um sistema fora do catálogo.
    supabase.from("sistemas").select("id, nome").eq("ativo", true).neq("slug", "outro").order("nome"),
  ]);

  const [{ data: inscricoes }, { data: mesasCriadas }, { data: ingressos }] = await Promise.all([
    supabase
      .from("inscricoes")
      .select("id, status, criado_em, mesas(titulo, slug, data_inicio)")
      .eq("usuario_id", user.id)
      .order("criado_em", { ascending: false }),
    ["mestre", "admin"].includes(perfil?.papel ?? "")
      ? supabase
          .from("mesas")
          .select("id, slug, titulo, status, modalidade, cancelado_em, cobranca_gerenciada_pelo_site")
          .eq("mestre_id", user.id)
          .order("criado_em", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase
      .from("evento_ingressos")
      .select("id, status, eventos(titulo, slug), evento_ingresso_tipos(nome)")
      .eq("usuario_id", user.id)
      .order("criado_em", { ascending: false }),
  ]);

  // Mesa cancelada fica na lista por um dia — tempo de o mestre ver que o
  // cancelamento pegou — e depois some, pra não entulhar a conta com mesa que
  // não existe mais. O filtro é aqui e não na query porque a lista precisa
  // distinguir "nunca criei mesa" de "as minhas já sumiram".
  const mesasVisiveis = mesasCriadas?.filter((mesa) => mesaVisivelParaODono(mesa)) ?? null;
  const escondeuCanceladas = (mesasCriadas?.length ?? 0) > (mesasVisiveis?.length ?? 0);

  const ehMestre = ["mestre", "admin"].includes(perfil?.papel ?? "");
  // O que faz o perfil público valer a pena existir. Se faltar, a conta
  // convida a preencher em vez de deixar a página vazia sem explicar nada.
  const perfilIncompleto = !perfil?.bio || (perfil?.sistemas_favoritos ?? []).length === 0;

  return (
    <>
      <PerfilSection
        nomeExibicao={perfil?.nome_exibicao ?? "?"}
        nomeCompleto={pessoais?.nome_completo ?? null}
        telefone={pessoais?.telefone ?? null}
        username={perfil?.username ?? ""}
        bio={perfil?.bio ?? null}
        avatarUrl={perfil?.avatar_url ?? null}
        perfilPublico={perfil?.perfil_publico ?? true}
        papel={perfil?.papel ?? "usuario"}
        sistemasFavoritos={perfil?.sistemas_favoritos ?? []}
        sistemas={sistemas ?? []}
      />

      <Container className="space-y-12 py-10 sm:py-14">
        {/* Convite pra completar o perfil. Fica no topo porque é a única
            coisa que a pessoa recém-cadastrada pode fazer aqui que muda
            alguma coisa — e a página inteira dela era só "Trocar senha". */}
        {perfilIncompleto && (
          <section className="rounded-2xl painel p-5 sm:p-6">
            <p className="rotulo-caps flex items-center gap-2 text-primary">
              <Sparkles className="size-4" aria-hidden />
              {t("completarRotulo")}
            </p>
            <h2 className="titulo-display titulo-bloco mt-2">{t("completarTitulo")}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("completarCorpo")}</p>
          </section>
        )}

        {perfil?.papel === "admin" && (
          <Link href="/admin" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
            {t("painelAdmin")}
          </Link>
        )}

        {mesasVisiveis && (
          <section>
            <TituloSecao
              acao={
                <Link href="/mesas/nova" className="text-sm font-medium text-primary hover:underline">
                  {t("novaMesa")}
                </Link>
              }
            >
              {t("minhasMesas")}
            </TituloSecao>

            {mesasVisiveis.length === 0 ? (
              <div className="mt-5">
                <EstadoVazio
                  icone={Wand2}
                  titulo={escondeuCanceladas ? t("semMesasAtivas") : t("semMesas")}
                  corpo={t("semMesasCorpo")}
                  acao={
                    <Link
                      href="/mesas/nova"
                      className={buttonVariants({ variant: "marca", className: "rounded-full" })}
                    >
                      {t("criarPrimeiraMesa")}
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {mesasVisiveis.map((mesa) => (
                  <li
                    key={mesa.id}
                    className="rounded-2xl painel p-4 transition-colors duration-200 hover:border-primary/30"
                  >
                    {/* Título e status em cima, ações embaixo. Antes era tudo
                        numa linha só: no celular "Cancelar" caía sozinha numa
                        terceira linha, e ela é a única irreversível. */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Link href={`/mesas/${mesa.slug}`} className="font-heading font-bold hover:underline">
                        {mesa.titulo}
                      </Link>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          STATUS_MESA_COR[mesa.status] ?? "border-border text-muted-foreground"
                        }`}
                      >
                        {STATUS_MESA_CHAVE[mesa.status] ? t(STATUS_MESA_CHAVE[mesa.status]) : mesa.status}
                      </span>
                    </div>

                    {mesa.status !== "cancelada" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                        {/* Vale pras duas modalidades: o mestre publica mesa
                            online também. Editar fica de fora quando o site é
                            quem cobra — essa é do admin, e a tela recusaria. */}
                        <Link
                          href={`/mesas/candidaturas/${mesa.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
                        >
                          {t("candidaturasDaMesa")}
                        </Link>
                        {!mesa.cobranca_gerenciada_pelo_site && (
                          <Link
                            href={`/mesas/editar/${mesa.id}`}
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full" })}
                          >
                            {t("editarMesa")}
                          </Link>
                        )}
                        {perfil?.papel === "admin" && mesa.status === "aguardando_aprovacao" && (
                          <AprovarMesaAdminButton mesaId={mesa.id} />
                        )}
                        {STATUS_MESA_CANCELAVEL.includes(mesa.status) && (
                          <span className="ms-auto">
                            <CancelarMesaMestreButton mesaId={mesa.id} />
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Quem ainda não mestra precisa saber que pode. O botão de pedir o
            papel vive em /mesas/nova; aqui fica o convite e, pra quem já
            pediu, o aviso de que o pedido está na fila — que antes não
            aparecia em lugar nenhum depois de enviado. */}
        {!ehMestre && (
          <section className="rounded-2xl painel p-5 sm:p-6">
            <p className="rotulo-caps flex items-center gap-2 text-primary">
              <Wand2 className="size-4" aria-hidden />
              {t("mestrarRotulo")}
            </p>
            <h2 className="titulo-display titulo-bloco mt-2">{t("mestrarTitulo")}</h2>
            {perfil?.mestre_solicitado_em ? (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("mestrarPedidoEnviado")}</p>
            ) : (
              <>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("mestrarCorpo")}</p>
                <Link
                  href="/mesas/nova"
                  className={buttonVariants({ variant: "outline", className: "mt-4 rounded-full" })}
                >
                  {t("mestrarCta")}
                </Link>
              </>
            )}
          </section>
        )}

        <section>
          <TituloSecao>{t("minhasCandidaturas")}</TituloSecao>
          {!inscricoes || inscricoes.length === 0 ? (
            <div className="mt-5">
              <EstadoVazio
                icone={Dices}
                titulo={t("semCandidaturas")}
                corpo={t("semCandidaturasCorpo")}
                acao={
                  <Link
                    href="/mesas"
                    className={buttonVariants({ variant: "marca", className: "rounded-full" })}
                  >
                    {t("verMesasAbertas")}
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {inscricoes.map((inscricao) => {
                const mesa = inscricao.mesas as unknown as { titulo: string; slug: string } | null;
                return (
                  <li
                    key={inscricao.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl painel p-4 text-sm transition-colors duration-200 hover:border-primary/30"
                  >
                    <Link href={`/mesas/${mesa?.slug}`} className="font-medium hover:underline">
                      {mesa?.titulo ?? t("mesaSemTitulo")}
                    </Link>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        STATUS_COR[inscricao.status] ?? "border-border text-muted-foreground"
                      }`}
                    >
                      {STATUS_CHAVE[inscricao.status] ? t(STATUS_CHAVE[inscricao.status]) : inscricao.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <TituloSecao>{t("meusIngressos")}</TituloSecao>
          {!ingressos || ingressos.length === 0 ? (
            /* A seção só existia quando havia ingresso, então quem nunca
               comprou nunca ficava sabendo que o site tem evento. */
            <div className="mt-5">
              <EstadoVazio
                icone={CalendarDays}
                titulo={t("semIngressos")}
                corpo={t("semIngressosCorpo")}
                acao={
                  <Link
                    href="/eventos"
                    className={buttonVariants({ variant: "outline", className: "rounded-full" })}
                  >
                    {t("verEventos")}
                  </Link>
                }
              />
            </div>
          ) : (
            /* Com cara de ingresso de verdade: o canhoto à esquerda com o
               picote, igual ao card de mesa e aos ingressos do evento. */
            <ul className="cascata mt-5 grid gap-3 sm:grid-cols-2">
              {ingressos.map((ingresso) => {
                const evento = ingresso.eventos as unknown as { titulo: string; slug: string } | null;
                const tipo = ingresso.evento_ingresso_tipos as unknown as { nome: string } | null;
                return (
                  <li key={ingresso.id} className="relative flex overflow-hidden rounded-2xl painel-alto">
                    <span aria-hidden className="flex w-14 shrink-0 items-center justify-center bg-marca text-white">
                      <Ticket className="size-5" aria-hidden />
                    </span>
                    <span aria-hidden className="my-3 border-l-2 border-dashed border-foreground/25" />
                    <span aria-hidden className="absolute -top-3 left-[3.4rem] size-6 rounded-full bg-background" />
                    <span aria-hidden className="absolute -bottom-3 left-[3.4rem] size-6 rounded-full bg-background" />

                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 p-4">
                      <div className="min-w-0">
                        <Link href={`/eventos/${evento?.slug}`} className="font-heading font-bold hover:underline">
                          {evento?.titulo ?? t("eventoSemTitulo")}
                        </Link>
                        {tipo && <p className="text-sm text-muted-foreground">{tipo.nome}</p>}
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_INGRESSO_COR[ingresso.status] ?? "border-border text-muted-foreground"
                        }`}
                      >
                        {STATUS_INGRESSO_CHAVE[ingresso.status]
                          ? t(STATUS_INGRESSO_CHAVE[ingresso.status])
                          : ingresso.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* O grupo é a porta da comunidade e o objetivo desta fase; a conta
            é onde a pessoa pousa depois de se cadastrar e não tinha nenhuma
            menção a ele. */}
        <section className="rounded-2xl painel-alto p-5 sm:p-6">
          <p className="rotulo-caps flex items-center gap-2 text-primary">
            <MessageCircle className="size-4" aria-hidden />
            {t("comunidadeRotulo")}
          </p>
          <h2 className="titulo-display titulo-bloco mt-2">{t("comunidadeTitulo")}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("comunidadeCorpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "marca", className: "mt-4 rounded-full" })}
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("comunidadeCta")}
          </a>
        </section>

        {/* Segurança e sair vão pro fim: trocar senha era a segunda coisa da
            página, e é a que menos gente usa. */}
        <section>
          <TituloSecao>{t("seguranca")}</TituloSecao>
          <div className="mt-5">
            <TrocarSenhaForm />
          </div>
        </section>

        <form action={sairAction}>
          <Button type="submit" variant="outline" className="rounded-full">
            {t("sair")}
          </Button>
        </form>
      </Container>
    </>
  );
}
