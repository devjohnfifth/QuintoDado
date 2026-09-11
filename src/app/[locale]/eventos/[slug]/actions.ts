"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { notificarAdminsSobreIngressoPendente } from "@/lib/notificacoes/ingresso";

const schema = z.object({
  eventoId: z.string().uuid(),
  tipoId: z.string().uuid(),
  slug: z.string().min(1),
  nomeCompleto: z.string().trim().min(3, "Digite seu nome completo.").max(160).optional(),
  telefone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Digite um número de telefone válido, com DDD.")
    .optional(),
});

export type ComprarIngressoResult = { ok: true } | { ok: false; error: string };

export async function comprarIngressoAction(input: unknown): Promise<ComprarIngressoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { eventoId, tipoId, slug, nomeCompleto, telefone } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Você precisa estar logado." };
  }

  const [{ data: perfil }, { data: evento }, { data: tipo }] = await Promise.all([
    supabase.from("profiles").select("nome_completo, telefone").eq("id", user.id).single(),
    supabase.from("eventos").select("titulo, status, capacidade_maxima, ingressos_vendidos").eq("id", eventoId).single(),
    supabase.from("evento_ingresso_tipos").select("nome, ativo").eq("id", tipoId).eq("evento_id", eventoId).single(),
  ]);

  if (!evento || evento.status !== "publicado") {
    return { ok: false, error: "Esse evento não está mais disponível." };
  }
  if (!tipo || !tipo.ativo) {
    return { ok: false, error: "Esse tipo de ingresso não está mais disponível." };
  }
  if (evento.capacidade_maxima && evento.ingressos_vendidos >= evento.capacidade_maxima) {
    return { ok: false, error: "As vagas desse evento esgotaram." };
  }

  const nomeFinal = perfil?.nome_completo || nomeCompleto;
  if (!nomeFinal) {
    return { ok: false, error: "Informe seu nome completo pra continuar." };
  }
  const telefoneFinal = perfil?.telefone || telefone;
  if (!telefoneFinal) {
    return { ok: false, error: "Informe seu telefone pra continuar." };
  }

  const dadosPerfilNovos: Record<string, string> = {};
  if (!perfil?.nome_completo && nomeCompleto) dadosPerfilNovos.nome_completo = nomeCompleto;
  if (!perfil?.telefone && telefone) dadosPerfilNovos.telefone = telefone;
  if (Object.keys(dadosPerfilNovos).length > 0) {
    const { error: perfilError } = await supabase
      .from("profiles")
      .update(dadosPerfilNovos)
      .eq("id", user.id);
    if (perfilError) {
      console.error("[comprarIngressoAction] erro ao salvar nome/telefone no perfil:", perfilError.message);
    }
  }

  const { error: ingressoError } = await supabase
    .from("evento_ingressos")
    .insert({ evento_id: eventoId, tipo_id: tipoId, usuario_id: user.id });

  if (ingressoError) {
    if (ingressoError.code === "23505") {
      return { ok: false, error: "Você já tem uma solicitação de ingresso pra esse evento." };
    }
    console.error("[comprarIngressoAction] erro:", ingressoError.message);
    return { ok: false, error: "Não deu pra enviar sua solicitação. Tente de novo em instantes." };
  }

  await notificarAdminsSobreIngressoPendente(eventoId, evento.titulo, tipo.nome, nomeFinal);

  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/conta");
  return { ok: true };
}
