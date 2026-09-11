"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificarUsuarioSobreIngresso } from "@/lib/notificacoes/ingresso";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase };
}

export async function aprovarIngressoAction(ingressoId: string, eventoId: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("evento_ingressos")
    .update({ status: "aprovado", aprovado_em: new Date().toISOString() })
    .eq("id", ingressoId);

  if (error) {
    console.error("[aprovarIngressoAction] erro:", error.message);
    throw new Error("Não deu pra aprovar o ingresso.");
  }

  await notificarUsuarioSobreIngresso(ingressoId, "aprovado");

  revalidatePath(`/admin/eventos/${eventoId}`);
}

export async function recusarIngressoAction(ingressoId: string, eventoId: string, motivo?: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("evento_ingressos")
    .update({
      status: "recusado",
      motivo_recusa: motivo || null,
      cancelado_em: new Date().toISOString(),
    })
    .eq("id", ingressoId);

  if (error) {
    console.error("[recusarIngressoAction] erro:", error.message);
    throw new Error("Não deu pra recusar o ingresso.");
  }

  await notificarUsuarioSobreIngresso(ingressoId, "recusado", motivo);

  revalidatePath(`/admin/eventos/${eventoId}`);
}
