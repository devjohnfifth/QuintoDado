import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Button } from "@/components/ui/button";
import { PerfilSection } from "@/components/site/perfil-section";
import { sairAction } from "../entrar/actions";

export const metadata: Metadata = { title: "Minha conta — Quinto Dado", robots: { index: false } };

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
  aprovado: "border-emerald-500/40 text-emerald-400",
  concluida: "border-emerald-500/40 text-emerald-400",
  recusado: "border-destructive/40 text-destructive",
  cancelada_jogador: "border-border text-muted-foreground",
  cancelada_mestre: "border-destructive/40 text-destructive",
  expirada: "border-border text-muted-foreground",
  reembolsada: "border-border text-muted-foreground",
};

export default async function ContaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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

  const [{ data: perfil }, { data: sistemas }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, nome_exibicao, avatar_url, papel, bio, sistemas_favoritos")
      .eq("id", user.id)
      .single(),
    // "Outro" não faz sentido como sistema favorito fixo — só existe pra
    // deixar quem cria mesa apontar um sistema fora do catálogo.
    supabase.from("sistemas").select("id, nome").eq("ativo", true).neq("slug", "outro").order("nome"),
  ]);

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select("id, status, criado_em, mesas(titulo, slug, data_inicio)")
    .eq("usuario_id", user.id)
    .order("criado_em", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <PerfilSection
        nomeExibicao={perfil?.nome_exibicao ?? "?"}
        username={perfil?.username ?? ""}
        bio={perfil?.bio ?? null}
        avatarUrl={perfil?.avatar_url ?? null}
        sistemasFavoritos={perfil?.sistemas_favoritos ?? []}
        sistemas={sistemas ?? []}
      />

      {perfil?.papel === "admin" && (
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Ir para o painel admin
        </Link>
      )}

      <h2 className="mt-10 font-heading text-lg font-bold">Minhas candidaturas</h2>
      {!inscricoes || inscricoes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Você ainda não se candidatou a nenhuma mesa.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {inscricoes.map((inscricao) => {
            const mesa = inscricao.mesas as unknown as { titulo: string; slug: string } | null;
            return (
              <li
                key={inscricao.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 text-sm transition-colors duration-200 hover:border-primary/30"
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

      <form action={sairAction} className="mt-10">
        <Button type="submit" variant="outline">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
