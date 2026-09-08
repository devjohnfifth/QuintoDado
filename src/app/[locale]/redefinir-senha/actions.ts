"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EstadoRedefinirSenha = { erro?: string } | null;

const schema = z.object({
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export async function redefinirSenhaAction(
  _estado: EstadoRedefinirSenha,
  formData: FormData,
): Promise<EstadoRedefinirSenha> {
  const parsed = schema.safeParse({ senha: formData.get("senha") });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Seu link de recuperação expirou. Peça um novo." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) {
    console.error("[redefinirSenhaAction] erro:", error.message);
    return { erro: "Não deu pra trocar a senha agora. Tente de novo." };
  }

  redirect("/conta?senha=trocada");
}
