"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function buscarNotificacoesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Sem filtro de janela de tempo aqui de propósito: uma notificação não
  // lida (ex.: "candidatura aprovada") não pode simplesmente sumir se o
  // usuário não abrir o site no mesmo dia — ela tem que continuar
  // aparecendo até ser lida. Busca as não lidas primeiro (sem limite
  // realista de bater) e só completa com lidas recentes se sobrar espaço,
  // pra uma não-lida antiga nunca ser empurrada pra fora pelo limite.
  const [{ data: naoLidas }, { data: lidas }] = await Promise.all([
    supabase
      .from("notificacoes")
      .select("id, titulo, corpo, url, lida_em, criado_em")
      .eq("usuario_id", user.id)
      .is("lida_em", null)
      .order("criado_em", { ascending: false }),
    supabase
      .from("notificacoes")
      .select("id, titulo, corpo, url, lida_em, criado_em")
      .eq("usuario_id", user.id)
      .not("lida_em", "is", null)
      .order("criado_em", { ascending: false })
      .limit(15),
  ]);

  const espacoRestante = Math.max(0, 15 - (naoLidas?.length ?? 0));
  return [...(naoLidas ?? []), ...(lidas ?? []).slice(0, espacoRestante)];
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
