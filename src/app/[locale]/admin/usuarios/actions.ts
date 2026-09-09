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

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { adminId: user.id };
}

export type AcaoUsuarioResult = { ok: true } | { ok: false; error: string };

/**
 * RLS de profiles só deixa cada usuário editar o próprio papel (e nem
 * isso — `perfil_edita_proprio` trava `papel` fixo no check). Promover
 * outra pessoa só dá com service_role, depois de confirmar admin aqui.
 */
export async function promoverMestreAction(usuarioId: string): Promise<AcaoUsuarioResult> {
  await exigirAdmin();
  const admin = serviceRole();

  const { error } = await admin
    .from("profiles")
    .update({ papel: "mestre", mestre_solicitado_em: null })
    .eq("id", usuarioId);

  if (error) {
    console.error("[promoverMestreAction] erro:", error.message);
    return { ok: false, error: "Não deu pra promover. Tente de novo." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function excluirUsuarioAction(usuarioId: string): Promise<AcaoUsuarioResult> {
  const { adminId } = await exigirAdmin();
  if (usuarioId === adminId) {
    return { ok: false, error: "Você não pode excluir a própria conta por aqui." };
  }

  const admin = serviceRole();
  const { error } = await admin.auth.admin.deleteUser(usuarioId);

  if (error) {
    console.error("[excluirUsuarioAction] erro:", error.message);
    return { ok: false, error: "Não deu pra excluir. Tente de novo." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
