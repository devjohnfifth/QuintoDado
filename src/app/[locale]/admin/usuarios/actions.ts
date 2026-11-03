"use server";

import { revalidatePath } from "next/cache";
import { serviceRole } from "@/lib/supabase/service-role";
import { exigirAdmin } from "@/lib/auth/exigir-admin";


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
