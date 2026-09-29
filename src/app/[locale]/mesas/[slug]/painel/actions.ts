"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirMestreDaMesa } from "@/lib/painel/acesso";
import { TIPOS_ENTIDADE, VISIBILIDADES } from "@/lib/painel/tipos";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function primeiroErro(e: z.ZodError) {
  return e.issues[0]?.message ?? "Dados inválidos.";
}

function revalidar(slug: string) {
  revalidatePath(`/mesas/${slug}/painel`);
  revalidatePath(`/mesas/${slug}/painel/elenco`);
  revalidatePath(`/mesas/${slug}/painel/sessoes`);
}

const entidadeSchema = z.object({
  tipo: z.enum(TIPOS_ENTIDADE),
  nome: z.string().trim().min(1, "Dê um nome.").max(120),
});

export async function criarEntidadeAction(slug: string, input: unknown): Promise<Resultado<{ id: string }>> {
  const parsed = entidadeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase, mesaId } = await exigirMestreDaMesa(slug);
  // Nasce oculta: revelar é sempre um ato deliberado.
  const { data, error } = await supabase
    .from("painel_entidades")
    .insert({ mesa_id: mesaId, tipo: parsed.data.tipo, nome: parsed.data.nome, oculta: true })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[painel] erro ao criar entidade:", error?.message);
    return { ok: false, error: "Não deu pra criar." };
  }

  revalidar(slug);
  return { ok: true, id: data.id };
}

export async function renomearEntidadeAction(slug: string, id: string, nome: string): Promise<Resultado> {
  const parsed = z.string().trim().min(1, "Dê um nome.").max(120).safeParse(nome);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_entidades").update({ nome: parsed.data }).eq("id", id);
  if (error) {
    console.error("[painel] erro ao renomear entidade:", error.message);
    return { ok: false, error: "Não deu pra salvar." };
  }

  revalidar(slug);
  return { ok: true };
}

export async function alternarEntidadeAction(slug: string, id: string, oculta: boolean): Promise<Resultado> {
  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_entidades").update({ oculta }).eq("id", id);
  if (error) {
    console.error("[painel] erro ao alternar entidade:", error.message);
    return { ok: false, error: "Não deu pra mudar a visibilidade." };
  }

  revalidar(slug);
  return { ok: true };
}

export async function apagarEntidadeAction(slug: string, id: string): Promise<Resultado> {
  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_entidades").delete().eq("id", id);
  if (error) {
    console.error("[painel] erro ao apagar entidade:", error.message);
    return { ok: false, error: "Não deu pra excluir." };
  }

  revalidar(slug);
  return { ok: true };
}

const campoSchema = z.object({
  entidadeId: z.string().uuid(),
  rotulo: z.string().trim().min(1, "Dê um rótulo ao campo.").max(80),
  valor: z.string().trim().max(4000).optional(),
  vis: z.enum(VISIBILIDADES),
  reveladoPara: z.array(z.string().uuid()).max(20).default([]),
});

export async function salvarCampoAction(
  slug: string,
  campoId: string | null,
  input: unknown,
): Promise<Resultado<{ id: string }>> {
  const parsed = campoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase, mesaId } = await exigirMestreDaMesa(slug);
  // "Específicos" sem ninguém escolhido é o mesmo que oculto — evita um campo
  // que parece revelado na tela do mestre e não chega em ninguém.
  const vis = parsed.data.vis === "especificos" && parsed.data.reveladoPara.length === 0 ? "oculto" : parsed.data.vis;
  const valores = {
    mesa_id: mesaId,
    entidade_id: parsed.data.entidadeId,
    rotulo: parsed.data.rotulo,
    valor: parsed.data.valor ?? null,
    vis,
    revelado_para: vis === "especificos" ? parsed.data.reveladoPara : [],
  };

  const { data, error } = campoId
    ? await supabase.from("painel_campos").update(valores).eq("id", campoId).select("id").single()
    : await supabase.from("painel_campos").insert(valores).select("id").single();

  if (error || !data) {
    console.error("[painel] erro ao salvar campo:", error?.message);
    return { ok: false, error: "Não deu pra salvar o campo." };
  }

  revalidar(slug);
  return { ok: true, id: data.id };
}

export async function apagarCampoAction(slug: string, id: string): Promise<Resultado> {
  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_campos").delete().eq("id", id);
  if (error) {
    console.error("[painel] erro ao apagar campo:", error.message);
    return { ok: false, error: "Não deu pra excluir o campo." };
  }

  revalidar(slug);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Sessões
// ---------------------------------------------------------------------

const sessaoSchema = z.object({
  data: z.string().trim().max(10).optional(),
  resumoMd: z.string().trim().max(20000).optional(),
});

export async function criarSessaoAction(slug: string): Promise<Resultado<{ id: string }>> {
  const { supabase, mesaId } = await exigirMestreDaMesa(slug);

  // Numera sozinho a partir da última: o mestre não deveria ter que lembrar.
  const { data: ultima, error: erroUltima } = await supabase
    .from("painel_sessoes")
    .select("numero")
    .eq("mesa_id", mesaId)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroUltima) {
    console.error("[painel] erro ao buscar última sessão:", erroUltima.message);
    return { ok: false, error: "Não deu pra criar a sessão." };
  }

  const { data, error } = await supabase
    .from("painel_sessoes")
    .insert({ mesa_id: mesaId, numero: (ultima?.numero ?? 0) + 1 })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[painel] erro ao criar sessão:", error?.message);
    return { ok: false, error: "Não deu pra criar a sessão." };
  }

  revalidar(slug);
  return { ok: true, id: data.id };
}

export async function salvarSessaoAction(slug: string, id: string, input: unknown): Promise<Resultado> {
  const parsed = sessaoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase
    .from("painel_sessoes")
    .update({ data: parsed.data.data || null, resumo_md: parsed.data.resumoMd || null })
    .eq("id", id);

  if (error) {
    console.error("[painel] erro ao salvar sessão:", error.message);
    return { ok: false, error: "Não deu pra salvar a sessão." };
  }

  revalidar(slug);
  return { ok: true };
}

export async function publicarSessaoAction(slug: string, id: string, publicado: boolean): Promise<Resultado> {
  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_sessoes").update({ publicado }).eq("id", id);
  if (error) {
    console.error("[painel] erro ao publicar sessão:", error.message);
    return { ok: false, error: "Não deu pra mudar a publicação." };
  }

  revalidar(slug);
  return { ok: true };
}

export async function apagarSessaoAction(slug: string, id: string): Promise<Resultado> {
  const { supabase } = await exigirMestreDaMesa(slug);
  const { error } = await supabase.from("painel_sessoes").delete().eq("id", id);
  if (error) {
    console.error("[painel] erro ao apagar sessão:", error.message);
    return { ok: false, error: "Não deu pra excluir a sessão." };
  }

  revalidar(slug);
  return { ok: true };
}
