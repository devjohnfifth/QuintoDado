"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  nomeExibicao: z.string().trim().min(2, "Nome muito curto.").max(80),
  nomeCompleto: z.string().trim().max(160).optional(),
  telefone: z.string().trim().max(20).optional(),
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
      nome_completo: d.nomeCompleto || null,
      telefone: d.telefone || null,
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

const schemaSenha = z
  .object({
    senhaAtual: z.string().min(1, "Digite sua senha atual."),
    novaSenha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
  });

export type TrocarSenhaResult = { ok: true } | { ok: false; error: string };

export async function trocarSenhaAction(input: unknown): Promise<TrocarSenhaResult> {
  const parsed = schemaSenha.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { senhaAtual, novaSenha } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, error: "Você precisa estar logado." };
  }

  // Confirma a senha atual antes de trocar — sem isso, uma sessão
  // esquecida aberta (ex.: computador compartilhado) deixaria qualquer
  // um trocar a senha sem saber a atual.
  const { error: reautenticaError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });
  if (reautenticaError) {
    return { ok: false, error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    console.error("[trocarSenhaAction] erro:", error.message);
    return { ok: false, error: "Não deu pra trocar a senha. Tente de novo." };
  }

  return { ok: true };
}
