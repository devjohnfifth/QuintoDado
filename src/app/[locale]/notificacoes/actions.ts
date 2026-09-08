"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function buscarNotificacoesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("notificacoes")
    .select("id, titulo, corpo, url, lida_em, criado_em")
    .eq("usuario_id", user.id)
    .gte("criado_em", umDiaAtras)
    .order("criado_em", { ascending: false })
    .limit(10);

  return data ?? [];
}

export async function marcarNotificacaoLidaAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notificacoes")
    .update({ lida_em: new Date().toISOString() })
    .eq("id", id)
    .eq("usuario_id", user.id);

  revalidatePath("/");
}
