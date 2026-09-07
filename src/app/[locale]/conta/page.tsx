import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

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

  const { data: perfil } = await supabase
    .from("profiles")
    .select("username, nome_exibicao, avatar_url, papel")
    .eq("id", user.id)
    .single();

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select("id, status, criado_em, mesas(titulo, slug, data_inicio)")
    .eq("usuario_id", user.id)
    .order("criado_em", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage src={perfil?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-lg font-semibold text-white">
            {iniciais(perfil?.nome_exibicao ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-xl font-bold">{perfil?.nome_exibicao}</h1>
          <p className="text-sm text-muted-foreground">@{perfil?.username}</p>
        </div>
      </div>

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
                className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 text-sm"
              >
                <Link href={`/mesas/${mesa?.slug}`} className="font-medium hover:underline">
                  {mesa?.titulo ?? "Mesa"}
                </Link>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
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
