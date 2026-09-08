"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  nomeExibicao: z.string().trim().min(2, "Nome muito curto.").max(80),
  bio: z.string().trim().max(280).optional(),
  sistemasFavoritos: z.array(z.string().uuid()).max(10),
  avatarUrl: z.string().url().nullable().optional(),
});

export type AtualizarPerfilResult = { ok: true } | { ok: false; error: string };

export async function atualizarPerfilAction(input: unknown): Promise<AtualizarPerfilResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Você precisa estar logado." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nome_exibicao: d.nomeExibicao,
      bio: d.bio || null,
      sistemas_favoritos: d.sistemasFavoritos,
      avatar_url: d.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[atualizarPerfilAction] erro:", error.message);
    return { ok: false, error: "Não deu pra salvar o perfil. Tente de novo." };
  }

  revalidatePath("/conta");
  return { ok: true };
}
