import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ClipboardList, Dices, UserCheck, Users, Ticket, CalendarDays, BookOpen } from "lucide-react";

async function buscarNumeros() {
  if (!isSupabaseConfigured())
    return { aguardandoAprovacao: 0, candidaturasPendentes: 0, mesasAbertas: 0, ingressosPendentes: 0 };

  const supabase = await createClient();
  const [
    { count: aguardandoAprovacao },
    { count: candidaturasPendentes },
    { count: mesasAbertas },
    { count: ingressosPendentes },
  ] = await Promise.all([
    supabase.from("mesas").select("id", { count: "exact", head: true }).eq("status", "aguardando_aprovacao"),
    supabase
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .in("status", ["candidatura_enviada", "aguardando_pagamento", "pago_em_analise"]),
    supabase
      .from("mesas")
      .select("id", { count: "exact", head: true })
      .in("status", ["publicada", "confirmada", "em_andamento"]),
    supabase.from("evento_ingressos").select("id", { count: "exact", head: true }).eq("status", "pendente"),
  ]);

  return {
    aguardandoAprovacao: aguardandoAprovacao ?? 0,
    candidaturasPendentes: candidaturasPendentes ?? 0,
    mesasAbertas: mesasAbertas ?? 0,
    ingressosPendentes: ingressosPendentes ?? 0,
  };
}

export default async function AdminHomePage() {
  const { aguardandoAprovacao, candidaturasPendentes, mesasAbertas, ingressosPendentes } = await buscarNumeros();

  /*
   * Cada número leva até onde se resolve ele. O painel existe pra dizer o
   * que precisa de você — mostrar "3 mesas aguardando aprovação" e deixar
   * a pessoa procurar essas três na mão era metade do trabalho.
   */
  const cartoes = [
    {
      valor: aguardandoAprovacao,
      label: aguardandoAprovacao === 1 ? "mesa aguardando aprovação" : "mesas aguardando aprovação",
      Icon: ClipboardList,
      urgente: aguardandoAprovacao > 0,
      href: { pathname: "/admin/mesas", query: { status: "aguardando_aprovacao" } },
    },
    {
      valor: candidaturasPendentes,
      label: candidaturasPendentes === 1 ? "candidatura pendente" : "candidaturas pendentes",
      Icon: UserCheck,
      urgente: candidaturasPendentes > 0,
      // Candidatura se resolve dentro de cada mesa; a lista das que estão
      // no ar é o caminho mais curto até elas.
      href: { pathname: "/admin/mesas", query: { status: "publicada" } },
    },
    {
      valor: ingressosPendentes,
      label: ingressosPendentes === 1 ? "ingresso pendente" : "ingressos pendentes",
      Icon: Ticket,
      urgente: ingressosPendentes > 0,
      href: { pathname: "/admin/eventos", query: { status: "publicado" } },
    },
    {
      valor: mesasAbertas,
      label: mesasAbertas === 1 ? "mesa aberta agora" : "mesas abertas agora",
      Icon: Dices,
      urgente: false,
      href: { pathname: "/admin/mesas", query: { status: "publicada" } },
    },
  ];

  return (
    <div>
      <h1 className="titulo-display titulo-secao">Painel</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group rounded-xl p-5 transition-colors duration-200 ${
              c.urgente
                ? "border border-primary/40 bg-primary/[0.06] hover:bg-primary/[0.12]"
                : "painel hover:border-primary/40"
            }`}
          >
            <c.Icon className={`size-5 ${c.urgente ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
            <p className={`titulo-display mt-3 text-3xl ${c.urgente ? "text-primary" : ""}`}>{c.valor}</p>
            <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/mesas"
          className="group rounded-xl painel p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10"
        >
          <p className="font-heading font-bold transition-colors group-hover:text-primary">Mesas</p>
          <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
            Criar mesas, aprovar mesas presenciais enviadas por mestres.
          </p>
        </Link>
        <Link
          href="/admin/eventos"
          className="group rounded-xl painel p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10"
        >
          <p className="flex items-center gap-1.5 font-heading font-bold transition-colors group-hover:text-primary">
            <CalendarDays className="size-4" aria-hidden />
            Eventos
          </p>
          <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
            Criar eventos, gerenciar ingressos e aprovar pedidos de compra.
          </p>
        </Link>
        <Link
          href="/admin/suplementos"
          className="group rounded-xl painel p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10"
        >
          <p className="flex items-center gap-1.5 font-heading font-bold transition-colors group-hover:text-primary">
            <BookOpen className="size-4" aria-hidden />
            Suplementos
          </p>
          <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
            Publicar material, subir arquivos e montar tabelas aleatórias.
          </p>
        </Link>
        <Link
          href="/admin/usuarios"
          className="group rounded-xl painel p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10"
        >
          <p className="flex items-center gap-1.5 font-heading font-bold transition-colors group-hover:text-primary">
            <Users className="size-4" aria-hidden />
            Usuários
          </p>
          <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
            Ver quem tá cadastrado, promover a mestre ou excluir uma conta.
          </p>
        </Link>
      </div>
    </div>
  );
}
