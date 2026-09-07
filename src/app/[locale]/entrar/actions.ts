"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idadeEmAnos } from "@/lib/idade";

export type EstadoFormEntrar = { erro?: string } | null;

export async function entrarComProvedorAction(formData: FormData) {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "discord") {
    redirect("/entrar?erro=provedor-invalido");
  }

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${site}/api/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/entrar?erro=oauth");
  }

  redirect(data.url);
}

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  senha: z.string().min(1, "Digite sua senha."),
});

export async function entrarComEmailAction(
  _estado: EstadoFormEntrar,
  formData: FormData,
): Promise<EstadoFormEntrar> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  redirect("/");
}

const signupSchema = z
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
    email: z.string().trim().email("E-mail inválido."),
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    aceiteTermos: z
      .string()
      .optional()
      .refine((v) => v === "on", "Você precisa aceitar os termos de uso."),
  })
  .refine((d) => idadeEmAnos(d.dataNascimento) >= 14, {
    message: "Você precisa ter pelo menos 14 anos pra se cadastrar.",
    path: ["dataNascimento"],
  });

export async function criarContaAction(
  _estado: EstadoFormEntrar,
  formData: FormData,
): Promise<EstadoFormEntrar> {
  const parsed = signupSchema.safeParse({
    nomeExibicao: formData.get("nomeExibicao"),
    username: formData.get("username"),
    dataNascimento: formData.get("dataNascimento"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    aceiteTermos: formData.get("aceiteTermos"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.senha,
    options: {
      data: {
        nome_exibicao: d.nomeExibicao,
        username: d.username,
        data_nascimento: d.dataNascimento,
        versao_termos: "v1",
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.status === 422) {
      return { erro: "Esse e-mail já tem conta. Tenta entrar em vez de cadastrar." };
    }
    console.error("[criarContaAction] erro no signUp:", error.message);
    return { erro: "Não deu pra criar a conta agora. Tente de novo em instantes." };
  }

  redirect("/entrar?cadastro=confirme-email");
}

export async function sairAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
