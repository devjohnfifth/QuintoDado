import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ClipboardList, Dices, UserCheck } from "lucide-react";

async function buscarNumeros() {
  if (!isSupabaseConfigured()) return { aguardandoAprovacao: 0, candidaturasPendentes: 0, mesasAbertas: 0 };

  const supabase = await createClient();
  const [{ count: aguardandoAprovacao }, { count: candidaturasPendentes }, { count: mesasAbertas }] =
    await Promise.all([
      supabase.from("mesas").select("id", { count: "exact", head: true }).eq("status", "aguardando_aprovacao"),
      supabase
        .from("inscricoes")
        .select("id", { count: "exact", head: true })
        .in("status", ["candidatura_enviada", "aguardando_pagamento", "pago_em_analise"]),
      supabase
        .from("mesas")
        .select("id", { count: "exact", head: true })
        .in("status", ["publicada", "confirmada", "em_andamento"]),
    ]);

  return {
    aguardandoAprovacao: aguardandoAprovacao ?? 0,
    candidaturasPendentes: candidaturasPendentes ?? 0,
    mesasAbertas: mesasAbertas ?? 0,
  };
}

export default async function AdminHomePage() {
  const { aguardandoAprovacao, candidaturasPendentes, mesasAbertas } = await buscarNumeros();

  const cartoes = [
    {
      valor: aguardandoAprovacao,
      label: aguardandoAprovacao === 1 ? "mesa aguardando aprovação" : "mesas aguardando aprovação",
      Icon: ClipboardList,
      urgente: aguardandoAprovacao > 0,
    },
    {
      valor: candidaturasPendentes,
      label: candidaturasPendentes === 1 ? "candidatura pendente" : "candidaturas pendentes",
      Icon: UserCheck,
      urgente: candidaturasPendentes > 0,
    },
    {
      valor: mesasAbertas,
      label: mesasAbertas === 1 ? "mesa aberta agora" : "mesas abertas agora",
      Icon: Dices,
      urgente: false,
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Painel</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cartoes.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-5 ${
              c.urgente ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card/60"
            }`}
          >
            <c.Icon className={`size-5 ${c.urgente ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
            <p className="mt-3 font-heading text-3xl font-bold">{c.valor}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/mesas"
          className="group rounded-xl border border-border bg-card/60 p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-accent"
        >
          <p className="font-heading font-bold transition-colors group-hover:text-primary">Mesas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Criar mesas, aprovar mesas presenciais enviadas por mestres.
          </p>
        </Link>
      </div>
    </div>
  );
}
