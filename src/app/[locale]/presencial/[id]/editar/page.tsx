import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { NovaMesaForm, type MesaPresencialExistente } from "../../nova/nova-mesa-form";

export const metadata: Metadata = { title: "Editar mesa — Quinto Dado", robots: { index: false } };

export default async function EditarMesaPresencialPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!isSupabaseConfigured()) {
    redirect({ href: "/entrar", locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  const [{ data: mesa }, { data: sistemas }] = await Promise.all([
    supabase
      .from("mesas")
      .select(
        "titulo, sistema_id, sistema_outro, sinopse, cidade_uf, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, classificacao, nivel_experiencia, preco_centavos, banner_url, mestre_id, modalidade, status",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("sistemas").select("id, nome, slug").eq("ativo", true).order("nome"),
  ]);

  // Sem RLS de UPDATE em mesas pra jogador comum (só mestre_id = auth.uid()
  // via a policy mesa_mestre_edita), mas confere de novo aqui pra devolver
  // uma mensagem clara em vez de um erro de permissão genérico do banco.
  // Mesa cancelada também não edita mais — não faz sentido reabrir o
  // formulário pra algo que já foi encerrado.
  if (!mesa || mesa.mestre_id !== user.id || mesa.modalidade !== "presencial" || mesa.status === "cancelada") {
    notFound();
  }

  const mesaExistente: MesaPresencialExistente = {
    titulo: mesa.titulo,
    sistemaId: mesa.sistema_id,
    sistemaOutroNome: mesa.sistema_outro,
    sinopse: mesa.sinopse,
    cidadeUf: mesa.cidade_uf ?? "",
    dataInicio: mesa.data_inicio,
    horarioInicio: mesa.horario_inicio,
    horarioFim: mesa.horario_fim,
    vagasTotal: mesa.vagas_total,
    minJogadores: mesa.min_jogadores,
    classificacao: mesa.classificacao,
    nivelExperiencia: mesa.nivel_experiencia,
    gratuita: mesa.preco_centavos === 0,
    valorReais: mesa.preco_centavos > 0 ? mesa.preco_centavos / 100 : null,
    bannerUrl: mesa.banner_url,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/conta" className="hover:underline">
          ← Voltar pra minha conta
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold">Editar mesa</h1>
      <NovaMesaForm sistemas={sistemas ?? []} mesaId={id} mesaExistente={mesaExistente} />
    </div>
  );
}
