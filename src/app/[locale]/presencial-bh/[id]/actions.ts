"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificarJogadorSobreCandidatura } from "@/lib/notificacoes/candidatura";

/**
 * Confere que o usuário logado é dono da mesa (ou admin). A UPDATE em
 * `inscricoes` já é barrada pela RLS pra quem não é (policy
 * `inscricao_mestre_avalia`) — essa checagem aqui é só pra devolver uma
 * mensagem clara em vez de deixar o erro genérico do Postgres estourar.
 */
async function exigirDonoDaMesa(mesaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  const { data: mesa } = await supabase.from("mesas").select("mestre_id").eq("id", mesaId).single();

  if (!mesa || (mesa.mestre_id !== user.id && perfil?.papel !== "admin")) {
    throw new Error("Você não tem acesso a essa mesa.");
  }

  return { supabase };
}

export async function aprovarInscricaoMestreAction(inscricaoId: string, mesaId: string) {
  const { supabase } = await exigirDonoDaMesa(mesaId);

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
    console.error("[aprovarInscricaoMestreAction] erro:", error.message);
    throw new Error("Não deu pra aprovar a candidatura.");
  }

  await notificarJogadorSobreCandidatura(inscricaoId, "aprovado");

  revalidatePath(`/presencial-bh/${mesaId}`);
  revalidatePath("/mesas");
}

export async function recusarInscricaoMestreAction(
  inscricaoId: string,
  mesaId: string,
  motivo?: string,
) {
  const { supabase } = await exigirDonoDaMesa(mesaId);

  const { error } = await supabase
    .from("inscricoes")
    .update({
      status: "recusado",
      motivo_recusa: motivo || null,
      cancelado_em: new Date().toISOString(),
    })
    .eq("id", inscricaoId);

  if (error) {
    console.error("[recusarInscricaoMestreAction] erro:", error.message);
    throw new Error("Não deu pra recusar a candidatura.");
  }

  await notificarJogadorSobreCandidatura(inscricaoId, "recusado", motivo);

  revalidatePath(`/presencial-bh/${mesaId}`);
  revalidatePath("/mesas");
}

export async function cancelarMesaMestreAction(mesaId: string) {
  const { supabase } = await exigirDonoDaMesa(mesaId);

  const { error } = await supabase
    .from("mesas")
    .update({ status: "cancelada", cancelado_em: new Date().toISOString() })
    .eq("id", mesaId);

  if (error) {
    console.error("[cancelarMesaMestreAction] erro:", error.message);
    throw new Error("Não deu pra cancelar a mesa.");
  }

  revalidatePath("/conta");
  revalidatePath("/presencial-bh");
  revalidatePath("/mesas");
}
