"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { slugify } from "@/lib/slugify";
import { perguntasFixas } from "@/lib/mesas/perguntas-fixas";
import { hojeNoBrasil } from "@/lib/mesas/horario";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase, adminId: user.id };
}

/**
 * Só avisa o mestre dono se ele não for o próprio admin agindo (o admin
 * sabe muito bem que acabou de aprovar/cancelar a própria mesa — a
 * notificação existe pra quando é a mesa presencial de OUTRO mestre).
 */
async function notificarMestreDaMesa(mesaId: string, adminId: string, tipo: "aprovada" | "cancelada") {
  const admin = serviceRole();
  const { data: mesa } = await admin.from("mesas").select("titulo, slug, mestre_id").eq("id", mesaId).single();
  if (!mesa || mesa.mestre_id === adminId) return;

  const { error } = await admin.from("notificacoes").insert({
    usuario_id: mesa.mestre_id,
    tipo: tipo === "aprovada" ? "mesa_aprovada" : "mesa_cancelada",
    titulo: tipo === "aprovada" ? "Sua mesa foi aprovada!" : "Sua mesa foi cancelada",
    corpo:
      tipo === "aprovada"
        ? `"${mesa.titulo}" já está publicada e pode receber candidaturas.`
        : `"${mesa.titulo}" foi cancelada pelo admin.`,
    url: `/mesas/${mesa.slug}`,
  });
  if (error) console.error("[notificarMestreDaMesa] erro:", error.message);
}

export async function aprovarMesaAction(mesaId: string) {
  const { supabase, adminId } = await exigirAdmin();

  const { error } = await supabase
    .from("mesas")
    .update({ status: "publicada", aprovada_por: adminId, aprovada_em: new Date().toISOString() })
    .eq("id", mesaId)
    .eq("status", "aguardando_aprovacao");

  if (error) {
    console.error("[aprovarMesaAction] erro:", error.message);
    throw new Error("Não deu pra aprovar a mesa.");
  }

  await notificarMestreDaMesa(mesaId, adminId, "aprovada");

  revalidatePath("/admin/mesas");
  revalidatePath("/mesas");
  revalidatePath("/presencial-bh");
}

export async function cancelarMesaAction(mesaId: string) {
  const { supabase, adminId } = await exigirAdmin();

  const { error } = await supabase
    .from("mesas")
    .update({ status: "cancelada", cancelado_em: new Date().toISOString() })
    .eq("id", mesaId);

  if (error) {
    console.error("[cancelarMesaAction] erro:", error.message);
    throw new Error("Não deu pra cancelar a mesa.");
  }

  await notificarMestreDaMesa(mesaId, adminId, "cancelada");

  revalidatePath("/admin/mesas");
  revalidatePath("/mesas");
  revalidatePath("/presencial-bh");
}

const schema = z
  .object({
    titulo: z.string().trim().min(3).max(120),
    sistemaId: z.string().uuid("Escolha um sistema."),
    sistemaOutroNome: z.string().trim().max(60).optional(),
    sinopse: z.string().trim().min(10).max(2000),
    tipo: z.enum(["one_shot", "aventura", "campanha"]),
    modalidade: z.enum(["online", "presencial"]),
    cidadeUf: z.string().trim().max(80).optional(),
    plataformaVtt: z.string().trim().max(80).optional(),
    plataformaVoz: z.string().trim().max(80).optional(),
    frequencia: z.enum(["unica", "semanal", "quinzenal", "mensal"]),
    qtdSessoes: z.coerce.number().int().min(1).max(999).optional(),
    dataInicio: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/),
    vagasTotal: z.coerce.number().int().min(1).max(12),
    minJogadores: z.coerce.number().int().min(1),
    classificacao: z.enum(["livre", "14", "16", "18"]),
    nivelExperiencia: z.enum(["iniciante", "intermediario", "avancado", "todos"]),
    gratuita: z.coerce.boolean(),
    valorReais: z.coerce.number().min(0).max(9999).optional(),
    cobrancaGerenciadaPeloSite: z.coerce.boolean(),
    publicarAgora: z.coerce.boolean(),
    bannerUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.minJogadores <= d.vagasTotal, {
    message: "O mínimo de jogadores não pode passar do total de vagas.",
    path: ["minJogadores"],
  })
  .refine((d) => d.modalidade !== "presencial" || Boolean(d.cidadeUf), {
    message: "Cidade é obrigatória pra mesa presencial.",
    path: ["cidadeUf"],
  })
  .refine((d) => d.dataInicio >= hojeNoBrasil(), {
    message: "A data de início não pode ser no passado.",
    path: ["dataInicio"],
  });

export type CriarMesaAdminResult = { ok: true; slug: string } | { ok: false; error: string };

export async function criarMesaAdmin(input: unknown): Promise<CriarMesaAdminResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const { supabase, adminId } = await exigirAdmin();

  const precoCentavos = d.gratuita ? 0 : Math.round((d.valorReais ?? 0) * 100);
  if (!d.gratuita && precoCentavos > 0 && precoCentavos < 500) {
    return { ok: false, error: "O valor precisa ser R$5,00 ou mais (ou marque como gratuita)." };
  }

  // "Outro" é uma linha real em `sistemas` (sem logo fixo) — confere pelo
  // slug no servidor, não confia só no que o cliente disse ser "outro".
  const { data: sistemaEscolhido } = await supabase
    .from("sistemas")
    .select("slug")
    .eq("id", d.sistemaId)
    .single();
  if (sistemaEscolhido?.slug === "outro" && !d.sistemaOutroNome) {
    return { ok: false, error: "Escreva o nome do sistema." };
  }

  const slug = `${slugify(d.titulo)}-${Math.random().toString(36).slice(2, 7)}`;
  const agora = new Date().toISOString();

  const { data: mesa, error: mesaError } = await supabase
    .from("mesas")
    .insert({
      slug,
      mestre_id: adminId,
      titulo: d.titulo,
      sinopse: d.sinopse,
      sistema_id: d.sistemaId,
      sistema_outro: sistemaEscolhido?.slug === "outro" ? d.sistemaOutroNome : null,
      tipo: d.tipo,
      modalidade: d.modalidade,
      cidade_uf: d.modalidade === "presencial" ? d.cidadeUf : null,
      plataforma_vtt: d.plataformaVtt || null,
      plataforma_voz: d.plataformaVoz || null,
      classificacao: d.classificacao,
      nivel_experiencia: d.nivelExperiencia,
      vagas_total: d.vagasTotal,
      min_jogadores: d.minJogadores,
      preco_centavos: precoCentavos,
      cobranca_gerenciada_pelo_site: d.cobrancaGerenciadaPeloSite,
      frequencia: d.frequencia,
      qtd_sessoes: d.qtdSessoes ?? null,
      data_inicio: d.dataInicio,
      horario_inicio: d.horarioInicio,
      horario_fim: d.horarioFim,
      banner_url: d.bannerUrl || null,
      status: d.publicarAgora ? "publicada" : "rascunho",
      aprovada_por: d.publicarAgora ? adminId : null,
      aprovada_em: d.publicarAgora ? agora : null,
    })
    .select("id")
    .single();

  if (mesaError || !mesa) {
    console.error("[criarMesaAdmin] erro ao inserir mesa:", mesaError?.message);
    return { ok: false, error: "Não deu pra criar a mesa. Tente de novo." };
  }

  const { error: perguntasError } = await supabase
    .from("mesa_perguntas")
    .insert(perguntasFixas(mesa.id));
  if (perguntasError) {
    console.error("[criarMesaAdmin] erro ao semear perguntas fixas:", perguntasError.message);
  }

  revalidatePath("/admin/mesas");
  revalidatePath("/mesas");
  return { ok: true, slug };
}

export type AtualizarMesaResult = { ok: true; slug: string } | { ok: false; error: string };

/**
 * Edita os dados de uma mesa já existente — o site não tinha NENHUMA forma
 * de corrigir um erro de digitação ou ajustar data/vagas sem cancelar e
 * recriar a mesa do zero, o que perderia todas as candidaturas já
 * recebidas (novo id = novas inscricoes). Não mexe em `status`,
 * `aprovada_por`, `aprovada_em` nem `slug` — isso continua só pelas ações
 * dedicadas de aprovar/cancelar, e o slug fica estável pra não quebrar
 * link já compartilhado.
 */
export async function atualizarMesaAction(mesaId: string, input: unknown): Promise<AtualizarMesaResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const { supabase } = await exigirAdmin();

  const { data: mesaAtual } = await supabase
    .from("mesas")
    .select("slug, vagas_preenchidas")
    .eq("id", mesaId)
    .single();
  if (!mesaAtual) {
    return { ok: false, error: "Mesa não encontrada." };
  }
  if (d.vagasTotal < mesaAtual.vagas_preenchidas) {
    return {
      ok: false,
      error: `Já tem ${mesaAtual.vagas_preenchidas} jogador(es) aprovado(s) — não dá pra reduzir o total de vagas abaixo disso.`,
    };
  }

  const precoCentavos = d.gratuita ? 0 : Math.round((d.valorReais ?? 0) * 100);
  if (!d.gratuita && precoCentavos > 0 && precoCentavos < 500) {
    return { ok: false, error: "O valor precisa ser R$5,00 ou mais (ou marque como gratuita)." };
  }

  const { data: sistemaEscolhido } = await supabase
    .from("sistemas")
    .select("slug")
    .eq("id", d.sistemaId)
    .single();
  if (sistemaEscolhido?.slug === "outro" && !d.sistemaOutroNome) {
    return { ok: false, error: "Escreva o nome do sistema." };
  }

  const { error } = await supabase
    .from("mesas")
    .update({
      titulo: d.titulo,
      sinopse: d.sinopse,
      sistema_id: d.sistemaId,
      sistema_outro: sistemaEscolhido?.slug === "outro" ? d.sistemaOutroNome : null,
      tipo: d.tipo,
      modalidade: d.modalidade,
      cidade_uf: d.modalidade === "presencial" ? d.cidadeUf : null,
      plataforma_vtt: d.plataformaVtt || null,
      plataforma_voz: d.plataformaVoz || null,
      classificacao: d.classificacao,
      nivel_experiencia: d.nivelExperiencia,
      vagas_total: d.vagasTotal,
      min_jogadores: d.minJogadores,
      preco_centavos: precoCentavos,
      cobranca_gerenciada_pelo_site: d.cobrancaGerenciadaPeloSite,
      frequencia: d.frequencia,
      qtd_sessoes: d.qtdSessoes ?? null,
      data_inicio: d.dataInicio,
      horario_inicio: d.horarioInicio,
      horario_fim: d.horarioFim,
      banner_url: d.bannerUrl || null,
    })
    .eq("id", mesaId);

  if (error) {
    console.error("[atualizarMesaAction] erro:", error.message);
    return { ok: false, error: "Não deu pra salvar as alterações. Tente de novo." };
  }

  revalidatePath("/admin/mesas");
  revalidatePath(`/admin/mesas/${mesaId}`);
  revalidatePath(`/mesas/${mesaAtual.slug}`);
  revalidatePath("/mesas");
  return { ok: true, slug: mesaAtual.slug };
}
