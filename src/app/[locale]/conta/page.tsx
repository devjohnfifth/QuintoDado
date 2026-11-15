import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Ticket } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { meusDadosPessoais } from "@/lib/auth/dados-pessoais";
import { Button } from "@/components/ui/button";
import { mesaVisivelParaODono } from "@/lib/mesas/cancelamento";
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

const STATUS_LABEL: Record<string, string> = {
  candidatura_enviada: "Candidatura enviada",
  aguardando_pagamento: "Aguardando pagamento",
  pago_em_analise: "Pagamento em análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirada: "Expirada",
  cancelada_jogador: "Cancelada por você",
  cancelada_mestre: "Cancelada pelo mestre",
  reembolsada: "Reembolsada",
  concluida: "Concluída",
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

const STATUS_MESA_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  publicada: "Publicada",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_MESA_COR: Record<string, string> = {
  aguardando_aprovacao: "border-primary/40 text-primary",
  publicada: "border-sucesso/40 text-sucesso",
  confirmada: "border-sucesso/40 text-sucesso",
  em_andamento: "border-sucesso/40 text-sucesso",
  cancelada: "border-destructive/40 text-destructive",
};

const STATUS_INGRESSO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

const STATUS_INGRESSO_COR: Record<string, string> = {
  aprovado: "border-sucesso/40 text-sucesso",
  recusado: "border-destructive/40 text-destructive",
  cancelado: "border-border text-muted-foreground",
};

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
      .select("username, nome_exibicao, avatar_url, papel, bio, sistemas_favoritos")
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <PerfilSection
        nomeExibicao={perfil?.nome_exibicao ?? "?"}
        nomeCompleto={pessoais?.nome_completo ?? null}
        telefone={pessoais?.telefone ?? null}
        username={perfil?.username ?? ""}
        bio={perfil?.bio ?? null}
        avatarUrl={perfil?.avatar_url ?? null}
        sistemasFavoritos={perfil?.sistemas_favoritos ?? []}
        sistemas={sistemas ?? []}
      />

      <TrocarSenhaForm />

      {perfil?.papel === "admin" && (
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("painelAdmin")}
        </Link>
      )}

      {mesasVisiveis && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">{t("minhasMesas")}</h2>
            <Link href="/mesas/nova" className="text-sm font-medium text-primary hover:underline">
              {t("novaMesa")}
            </Link>
          </div>
          {mesasVisiveis.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {escondeuCanceladas ? t("semMesasAtivas") : t("semMesas")}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {mesasVisiveis.map((mesa) => (
                <li
                  key={mesa.id}
                  className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 rounded-xl border border-border bg-card/60 p-4 text-sm transition-colors duration-200 hover:border-primary/30"
                >
                  <Link href={`/mesas/${mesa.slug}`} className="font-medium hover:underline">
                    {mesa.titulo}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        STATUS_MESA_COR[mesa.status] ?? "border-border text-muted-foreground"
                      }`}
                    >
                      {STATUS_MESA_LABEL[mesa.status] ?? mesa.status}
                    </span>
                    {/* Vale pras duas modalidades: o mestre publica mesa
                        online também, e antes ele ficava sem nenhuma ação
                        aqui. Editar fica de fora quando o site é quem cobra a
                        mesa — essa é do admin, e a tela de edição recusaria. */}
                    {mesa.status !== "cancelada" && (
                      <>
                        <Link
                          href={`/mesas/candidaturas/${mesa.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {t("candidaturasDaMesa")}
                        </Link>
                        {!mesa.cobranca_gerenciada_pelo_site && (
                          <Link
                            href={`/mesas/editar/${mesa.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {t("editarMesa")}
                          </Link>
                        )}
                      </>
                    )}
                    {perfil?.papel === "admin" && mesa.status === "aguardando_aprovacao" && (
                      <AprovarMesaAdminButton mesaId={mesa.id} />
                    )}
                    {STATUS_MESA_CANCELAVEL.includes(mesa.status) && (
                      <CancelarMesaMestreButton mesaId={mesa.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h2 className="mt-10 font-heading text-lg font-bold">{t("minhasCandidaturas")}</h2>
      {!inscricoes || inscricoes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("semCandidaturas")}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {inscricoes.map((inscricao) => {
            const mesa = inscricao.mesas as unknown as { titulo: string; slug: string } | null;
            return (
              <li
                key={inscricao.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-4 text-sm transition-colors duration-200 hover:border-primary/30"
              >
                <Link href={`/mesas/${mesa?.slug}`} className="font-medium hover:underline">
                  {mesa?.titulo ?? "Mesa"}
                </Link>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    STATUS_COR[inscricao.status] ?? "border-border text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[inscricao.status] ?? inscricao.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {ingressos && ingressos.length > 0 && (
        <>
          <h2 className="titulo-display titulo-secao mt-12">{t("meusIngressos")}</h2>
          {/* Com cara de ingresso de verdade: o canhoto à esquerda com o
              picote, igual ao card de mesa e aos ingressos do evento. Antes
              era uma linha de lista que não parecia valer nada. */}
          <ul className="cascata mt-5 grid gap-3 sm:grid-cols-2">
            {ingressos.map((ingresso) => {
              const evento = ingresso.eventos as unknown as { titulo: string; slug: string } | null;
              const tipo = ingresso.evento_ingresso_tipos as unknown as { nome: string } | null;
              return (
                <li key={ingresso.id} className="relative flex overflow-hidden rounded-2xl painel-alto">
                  <span
                    aria-hidden
                    className="flex w-14 shrink-0 items-center justify-center bg-marca text-white"
                  >
                    <Ticket className="size-5" aria-hidden />
                  </span>
                  <span aria-hidden className="my-3 border-l-2 border-dashed border-foreground/25" />
                  <span aria-hidden className="absolute -top-3 left-[3.4rem] size-6 rounded-full bg-background" />
                  <span aria-hidden className="absolute -bottom-3 left-[3.4rem] size-6 rounded-full bg-background" />

                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <Link href={`/eventos/${evento?.slug}`} className="font-heading font-bold hover:underline">
                        {evento?.titulo ?? "Evento"}
                      </Link>
                      {tipo && <p className="text-sm text-muted-foreground">{tipo.nome}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_INGRESSO_COR[ingresso.status] ?? "border-border text-muted-foreground"
                      }`}
                    >
                      {STATUS_INGRESSO_LABEL[ingresso.status] ?? ingresso.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <form action={sairAction} className="mt-10">
        <Button type="submit" variant="outline">
          {t("sair")}
        </Button>
      </form>
    </div>
  );
}
