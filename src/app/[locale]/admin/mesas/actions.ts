"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { perguntasFixas } from "@/lib/mesas/perguntas-fixas";

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

  revalidatePath("/admin/mesas");
  revalidatePath("/mesas");
  revalidatePath("/presencial-bh");
}

export async function cancelarMesaAction(mesaId: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("mesas")
    .update({ status: "cancelada" })
    .eq("id", mesaId);

  if (error) {
    console.error("[cancelarMesaAction] erro:", error.message);
    throw new Error("Não deu pra cancelar a mesa.");
  }

  revalidatePath("/admin/mesas");
  revalidatePath("/mesas");
  revalidatePath("/presencial-bh");
}

const schema = z
  .object({
    titulo: z.string().trim().min(3).max(120),
    sistemaId: z.string().uuid("Escolha um sistema."),
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
  })
  .refine((d) => d.minJogadores <= d.vagasTotal, {
    message: "O mínimo de jogadores não pode passar do total de vagas.",
    path: ["minJogadores"],
  })
  .refine((d) => d.modalidade !== "presencial" || Boolean(d.cidadeUf), {
    message: "Cidade é obrigatória pra mesa presencial.",
    path: ["cidadeUf"],
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
