"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase };
}

/**
 * E-mail não fica em `profiles` (só em `auth.users`, que RLS normal não
 * alcança) — busca sob demanda via service_role só quando o admin
 * realmente clica pra ver, em vez de expor de cara pra cada candidato.
 */
export async function buscarEmailCandidatoAction(usuarioId: string): Promise<string | null> {
  await exigirAdmin();
  const admin = serviceRole();
  const { data, error } = await admin.auth.admin.getUserById(usuarioId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

/**
 * O jogador nunca é dono da notificação que a gente cria pra ele (é o
 * admin/mestre que aciona), então a policy `notificacao_propria` (só o
 * dono escreve) bloquearia um insert com o client normal — por isso usa
 * service_role aqui, igual `notificarMestre` faz pro caminho inverso.
 */
async function notificarJogador(
  inscricaoId: string,
  tipo: "aprovado" | "recusado",
  motivo?: string,
) {
  const admin = serviceRole();

  const { data: inscricao } = await admin
    .from("inscricoes")
    .select("usuario_id, mesas(titulo, slug)")
    .eq("id", inscricaoId)
    .single();
  if (!inscricao) return;

  const mesa = inscricao.mesas as unknown as { titulo: string; slug: string } | null;
  if (!mesa) return;

  const corpoRecusa = motivo
    ? `Sua candidatura pra "${mesa.titulo}" não foi aprovada dessa vez. Motivo: ${motivo}`
    : `Sua candidatura pra "${mesa.titulo}" não foi aprovada dessa vez.`;

  const { error } = await admin.from("notificacoes").insert({
    usuario_id: inscricao.usuario_id,
    tipo: tipo === "aprovado" ? "candidatura_aprovada" : "candidatura_recusada",
    titulo: tipo === "aprovado" ? "Candidatura aprovada!" : "Candidatura não aprovada",
    corpo:
      tipo === "aprovado"
        ? `Você foi aprovado pra "${mesa.titulo}"! Confira os detalhes.`
        : corpoRecusa,
    url: `/mesas/${mesa.slug}`,
  });

  if (error) {
    console.error("[notificarJogador] erro ao criar notificação:", error.message);
  }
}

export async function aprovarInscricaoAction(inscricaoId: string, mesaId: string) {
  const { supabase } = await exigirAdmin();

  // Segunda trava contra lotar além da conta — a candidatura já barra vaga
  // esgotada na hora de enviar, mas isso não protege contra duas
  // candidaturas concorrentes sendo aprovadas quase ao mesmo tempo.
  const { data: mesa } = await supabase
    .from("mesas")
    .select("vagas_total, vagas_preenchidas")
    .eq("id", mesaId)
    .single();
  if (mesa && mesa.vagas_preenchidas >= mesa.vagas_total) {
    throw new Error("Essa mesa já está com todas as vagas preenchidas.");
  }

  const { error } = await supabase
    .from("inscricoes")
    .update({ status: "aprovado", aprovado_em: new Date().toISOString() })
    .eq("id", inscricaoId);

  if (error) {
    console.error("[aprovarInscricaoAction] erro:", error.message);
    throw new Error("Não deu pra aprovar a candidatura.");
  }

  await notificarJogador(inscricaoId, "aprovado");

  revalidatePath(`/admin/mesas/${mesaId}`);
  revalidatePath("/mesas");
}

export async function recusarInscricaoAction(
  inscricaoId: string,
  mesaId: string,
  motivo?: string,
) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("inscricoes")
    .update({
      status: "recusado",
      motivo_recusa: motivo || null,
      cancelado_em: new Date().toISOString(),
    })
    .eq("id", inscricaoId);

  if (error) {
    console.error("[recusarInscricaoAction] erro:", error.message);
    throw new Error("Não deu pra recusar a candidatura.");
  }

  await notificarJogador(inscricaoId, "recusado", motivo);

  revalidatePath(`/admin/mesas/${mesaId}`);
  revalidatePath("/mesas");
}
