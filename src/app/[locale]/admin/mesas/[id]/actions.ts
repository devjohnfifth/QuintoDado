"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function aprovarInscricaoAction(inscricaoId: string, mesaId: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("inscricoes")
    .update({ status: "aprovado", aprovado_em: new Date().toISOString() })
    .eq("id", inscricaoId);

  if (error) {
    console.error("[aprovarInscricaoAction] erro:", error.message);
    throw new Error("Não deu pra aprovar a candidatura.");
  }

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

  revalidatePath(`/admin/mesas/${mesaId}`);
  revalidatePath("/mesas");
}
