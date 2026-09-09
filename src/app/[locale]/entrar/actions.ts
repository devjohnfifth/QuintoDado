"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { idadeEmAnos } from "@/lib/idade";
import { sanitizarUsername } from "@/lib/username";

export type EstadoFormEntrar = {
  erro?: string;
  // Só usados pelo formulário de cadastro: em vez de limpar o formulário
  // inteiro a cada erro, ecoa de volta o que a pessoa já tinha digitado
  // certo e diz só quais campos precisam ser preenchidos de novo.
  camposInvalidos?: string[];
  valores?: Record<string, string>;
} | null;

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
  const bruto = {
    nomeExibicao: String(formData.get("nomeExibicao") ?? ""),
    // Sanitiza de novo aqui, não só no cliente: autofill e gerenciadores de
    // senha às vezes preenchem o campo sem disparar o evento que aciona a
    // limpeza em tempo real no navegador, e o valor "cru" (maiúsculas, @,
    // espaço) chegava direto pro servidor e caía sempre no erro de regex.
    username: sanitizarUsername(String(formData.get("username") ?? "")),
    dataNascimento: String(formData.get("dataNascimento") ?? ""),
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    aceiteTermos: formData.get("aceiteTermos"),
  };
  const parsed = signupSchema.safeParse(bruto);
  if (!parsed.success) {
    // Nunca ecoa a senha de volta pro cliente — só os campos que dá pra
    // reexibir com segurança. Um campo só entra em "camposInvalidos" (e
    // por isso é limpo no formulário) se o próprio Zod apontou erro nele;
    // os demais mantêm o que a pessoa digitou.
    const camposInvalidos = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    const { senha: _senha, aceiteTermos: _aceiteTermos, ...valoresSeguros } = bruto;
    return {
      erro: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      camposInvalidos,
      valores: valoresSeguros,
    };
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
    const { senha: _senha, aceiteTermos: _aceiteTermos, ...valoresSeguros } = bruto;
    if (error.code === "user_already_exists" || error.status === 422) {
      return {
        erro: "Esse e-mail já tem conta. Tenta entrar em vez de cadastrar.",
        camposInvalidos: ["email"],
        valores: valoresSeguros,
      };
    }
    console.error("[criarContaAction] erro no signUp:", error.message);
    return { erro: "Não deu pra criar a conta agora. Tente de novo em instantes.", valores: valoresSeguros };
  }

  redirect("/entrar?cadastro=confirme-email");
}

const esqueciSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
});

export async function esqueciSenhaAction(
  _estado: EstadoFormEntrar,
  formData: FormData,
): Promise<EstadoFormEntrar> {
  const parsed = esqueciSenhaSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/redefinir-senha`,
  });

  // Não revela se o e-mail existe ou não — evita enumerar contas.
  if (error) {
    console.error("[esqueciSenhaAction] erro:", error.message);
  }

  redirect("/entrar?recuperacao=enviada");
}

export async function sairAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
