"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { hojeNoBrasil } from "@/lib/mesas/horario";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase, adminId: user.id };
}

const tipoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(2, "Nome do ingresso muito curto.").max(60),
  descricao: z.string().trim().max(300).optional(),
  precoReais: z.coerce.number().min(0.01, "O preço precisa ser maior que zero.").max(99999),
});

const schema = z
  .object({
    titulo: z.string().trim().min(3, "Título muito curto.").max(120),
    subtitulo: z.string().trim().max(160).optional(),
    descricao: z.string().trim().min(10, "Conte mais sobre o evento.").max(4000),
    cidadeUf: z.string().trim().min(3, "Informe a cidade.").max(80),
    local: z.string().trim().max(160).optional(),
    dataInicio: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
    dataFim: z
      .string()
      .optional()
      .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Data final inválida."),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido.").optional().or(z.literal("")),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido.").optional().or(z.literal("")),
    chavePix: z.string().trim().max(140).optional(),
    whatsappConfirmacao: z.string().trim().max(20).optional(),
    capacidadeMaxima: z.coerce.number().int().min(1).max(99999).optional(),
    bannerUrl: z.string().url().nullable().optional(),
    publicarAgora: z.coerce.boolean(),
    tipos: z.array(tipoSchema).min(1, "Adicione pelo menos um tipo de ingresso."),
  })
  .refine((d) => !d.dataFim || d.dataFim >= d.dataInicio, {
    message: "A data final não pode ser antes da data de início.",
    path: ["dataFim"],
  })
  .refine((d) => d.dataInicio >= hojeNoBrasil(), {
    message: "A data de início não pode ser no passado.",
    path: ["dataInicio"],
  });

export type EventoActionResult = { ok: true; slug: string } | { ok: false; error: string };

export async function criarEventoAction(input: unknown): Promise<EventoActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const { supabase, adminId } = await exigirAdmin();

  const slug = `${slugify(d.titulo)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .insert({
      slug,
      criado_por: adminId,
      titulo: d.titulo,
      subtitulo: d.subtitulo || null,
      descricao: d.descricao,
      banner_url: d.bannerUrl || null,
      cidade_uf: d.cidadeUf,
      local: d.local || null,
      data_inicio: d.dataInicio,
      data_fim: d.dataFim || null,
      horario_inicio: d.horarioInicio || null,
      horario_fim: d.horarioFim || null,
      chave_pix: d.chavePix || null,
      whatsapp_confirmacao: d.whatsappConfirmacao || null,
      capacidade_maxima: d.capacidadeMaxima ?? null,
      status: d.publicarAgora ? "publicado" : "rascunho",
    })
    .select("id")
    .single();

  if (eventoError || !evento) {
    console.error("[criarEventoAction] erro ao inserir evento:", eventoError?.message);
    return { ok: false, error: "Não deu pra criar o evento. Tente de novo." };
  }

  const { error: tiposError } = await supabase.from("evento_ingresso_tipos").insert(
    d.tipos.map((t, i) => ({
      evento_id: evento.id,
      nome: t.nome,
      descricao: t.descricao || null,
      preco_centavos: Math.round(t.precoReais * 100),
      ordem: i,
    })),
  );
  if (tiposError) {
    console.error("[criarEventoAction] erro ao inserir tipos de ingresso:", tiposError.message);
    return { ok: false, error: "Evento criado, mas os tipos de ingresso não salvaram. Edite o evento pra corrigir." };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  revalidatePath("/");
  return { ok: true, slug };
}

/**
 * Não apaga tipo de ingresso que já tem gente com pedido em cima (a FK de
 * evento_ingressos.tipo_id bloquearia mesmo, mas o motivo de verdade é não
 * perder histórico de quem comprou o quê) — tipo que sumiu do form vira
 * `ativo = false` em vez de ser removido de fato.
 */
export async function atualizarEventoAction(eventoId: string, input: unknown): Promise<EventoActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const { supabase } = await exigirAdmin();

  const { data: eventoAtual } = await supabase.from("eventos").select("slug").eq("id", eventoId).single();
  if (!eventoAtual) {
    return { ok: false, error: "Evento não encontrado." };
  }

  const { error: eventoError } = await supabase
    .from("eventos")
    .update({
      titulo: d.titulo,
      subtitulo: d.subtitulo || null,
      descricao: d.descricao,
      banner_url: d.bannerUrl || null,
      cidade_uf: d.cidadeUf,
      local: d.local || null,
      data_inicio: d.dataInicio,
      data_fim: d.dataFim || null,
      horario_inicio: d.horarioInicio || null,
      horario_fim: d.horarioFim || null,
      chave_pix: d.chavePix || null,
      whatsapp_confirmacao: d.whatsappConfirmacao || null,
      capacidade_maxima: d.capacidadeMaxima ?? null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", eventoId);

  if (eventoError) {
    console.error("[atualizarEventoAction] erro:", eventoError.message);
    return { ok: false, error: "Não deu pra salvar as alterações. Tente de novo." };
  }

  const { data: tiposExistentes } = await supabase
    .from("evento_ingresso_tipos")
    .select("id")
    .eq("evento_id", eventoId);

  const idsNoForm = new Set(d.tipos.filter((t) => t.id).map((t) => t.id));
  const idsPraDesativar = (tiposExistentes ?? []).map((t) => t.id).filter((id) => !idsNoForm.has(id));

  if (idsPraDesativar.length > 0) {
    await supabase.from("evento_ingresso_tipos").update({ ativo: false }).in("id", idsPraDesativar);
  }

  for (const [i, t] of d.tipos.entries()) {
    const dados = {
      nome: t.nome,
      descricao: t.descricao || null,
      preco_centavos: Math.round(t.precoReais * 100),
      ordem: i,
      ativo: true,
    };
    if (t.id) {
      await supabase.from("evento_ingresso_tipos").update(dados).eq("id", t.id).eq("evento_id", eventoId);
    } else {
      await supabase.from("evento_ingresso_tipos").insert({ ...dados, evento_id: eventoId });
    }
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);
  revalidatePath(`/eventos/${eventoAtual.slug}`);
  revalidatePath("/eventos");
  revalidatePath("/");
  return { ok: true, slug: eventoAtual.slug };
}

export async function mudarStatusEventoAction(eventoId: string, status: "publicado" | "encerrado" | "cancelado") {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("eventos").update({ status }).eq("id", eventoId);
  if (error) {
    console.error("[mudarStatusEventoAction] erro:", error.message);
    throw new Error("Não deu pra atualizar o status do evento.");
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);
  revalidatePath("/eventos");
  revalidatePath("/");
}
