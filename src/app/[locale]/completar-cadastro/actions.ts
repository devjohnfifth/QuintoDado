"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idadeEmAnos } from "@/lib/idade";

export type EstadoCompletarCadastro = { erro?: string } | null;

const schema = z
  .object({
    nomeExibicao: z.string().trim().min(2, "Nome muito curto.").max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9_-]{3,30}$/,
        "Use só letras minúsculas, números, - ou _ (3 a 30 caracteres).",
      ),
    dataNascimento: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Data de nascimento inválida."),
    aceiteTermos: z
      .string()
      .optional()
      .refine((v) => v === "on", "Você precisa aceitar os termos de uso."),
  })
  .refine((d) => idadeEmAnos(d.dataNascimento) >= 14, {
    message: "Você precisa ter pelo menos 14 anos pra usar o Quinto Dado.",
    path: ["dataNascimento"],
  });

export async function completarCadastroAction(
  _estado: EstadoCompletarCadastro,
  formData: FormData,
): Promise<EstadoCompletarCadastro> {
  const parsed = schema.safeParse({
    nomeExibicao: formData.get("nomeExibicao"),
    username: formData.get("username"),
    dataNascimento: formData.get("dataNascimento"),
    aceiteTermos: formData.get("aceiteTermos"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { error: perfilError } = await supabase.from("profiles").insert({
    id: user.id,
    username: d.username,
    nome_exibicao: d.nomeExibicao,
    data_nascimento: d.dataNascimento,
  });

  if (perfilError) {
    if (perfilError.code === "23505") {
      return { erro: "Esse nome de usuário já está em uso." };
    }
    console.error("[completarCadastroAction] erro ao criar profile:", perfilError.message);
    return { erro: "Não deu pra concluir o cadastro agora. Tente de novo." };
  }

  const { error: aceiteError } = await supabase.from("aceites_termos").insert({
    usuario_id: user.id,
    documento: "termos",
    versao: "v1",
  });
  if (aceiteError) {
    console.error("[completarCadastroAction] erro ao registrar aceite:", aceiteError.message);
  }

  redirect("/");
}
