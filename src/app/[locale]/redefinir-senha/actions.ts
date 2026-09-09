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

const schemaComCodigo = z.object({
  email: z.string().trim().email("E-mail inválido."),
  codigo: z.string().trim().min(6, "Código inválido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

// Alternativa ao link por e-mail: o mesmo e-mail de recuperação também traz
// um código curto. Ele não depende de clicar em nenhum link — evita todo o
// problema de links de uso único sendo consumidos por proteção
// antirastreamento do navegador ou por qualquer outro salto de rede antes
// da pessoa clicar de verdade.
export async function redefinirSenhaComCodigoAction(
  _estado: EstadoRedefinirSenha,
  formData: FormData,
): Promise<EstadoRedefinirSenha> {
  const parsed = schemaComCodigo.safeParse({
    email: formData.get("email"),
    codigo: formData.get("codigo"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.codigo,
    type: "recovery",
  });
  if (verifyError) {
    return { erro: "Código inválido ou expirado. Confira o e-mail mais recente e tente de novo." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (updateError) {
    console.error("[redefinirSenhaComCodigoAction] erro:", updateError.message);
    return { erro: "Não deu pra trocar a senha agora. Tente de novo." };
  }

  redirect("/conta?senha=trocada");
}
