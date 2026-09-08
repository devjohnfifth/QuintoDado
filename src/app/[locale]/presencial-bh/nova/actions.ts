"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { perguntasFixas } from "@/lib/mesas/perguntas-fixas";

const schema = z
  .object({
    titulo: z.string().trim().min(3, "Título muito curto.").max(120),
    sistemaId: z.string().uuid("Escolha um sistema."),
    sinopse: z.string().trim().min(10, "Conte um pouco mais sobre a mesa.").max(2000),
    cidadeUf: z.string().trim().min(3, "Informe a cidade.").max(80),
    dataInicio: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
    vagasTotal: z.coerce.number().int().min(1).max(12),
    minJogadores: z.coerce.number().int().min(1),
    classificacao: z.enum(["livre", "14", "16", "18"]),
    nivelExperiencia: z.enum(["iniciante", "intermediario", "avancado", "todos"]),
    gratuita: z.coerce.boolean(),
    valorReais: z.coerce.number().min(0).max(999).optional(),
    bannerUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.minJogadores <= d.vagasTotal, {
    message: "O mínimo de jogadores não pode passar do total de vagas.",
    path: ["minJogadores"],
  });

export type CriarMesaPresencialResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function criarMesaPresencial(
  input: unknown,
): Promise<CriarMesaPresencialResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Você precisa estar logado." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (!perfil || !["mestre", "admin"].includes(perfil.papel)) {
    return { ok: false, error: "Você precisa ter o papel de mestre pra criar uma mesa." };
  }

  const precoCentavos = dados.gratuita ? 0 : Math.round((dados.valorReais ?? 0) * 100);
  if (!dados.gratuita && precoCentavos > 0 && precoCentavos < 500) {
    return {
      ok: false,
      error: "O valor sugerido precisa ser R$5,00 ou mais (ou marque como gratuita).",
    };
  }

  const slug = `${slugify(dados.titulo)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: mesa, error: mesaError } = await supabase
    .from("mesas")
    .insert({
      slug,
      mestre_id: user.id,
      titulo: dados.titulo,
      sinopse: dados.sinopse,
      sistema_id: dados.sistemaId,
      tipo: "one_shot",
      modalidade: "presencial",
      cidade_uf: dados.cidadeUf,
      classificacao: dados.classificacao,
      nivel_experiencia: dados.nivelExperiencia,
      vagas_total: dados.vagasTotal,
      min_jogadores: dados.minJogadores,
      preco_centavos: precoCentavos,
      cobranca_gerenciada_pelo_site: false,
      data_inicio: dados.dataInicio,
      horario_inicio: dados.horarioInicio,
      horario_fim: dados.horarioFim,
      banner_url: dados.bannerUrl || null,
      status: "aguardando_aprovacao",
    })
    .select("id")
    .single();

  if (mesaError || !mesa) {
    console.error("[criarMesaPresencial] erro ao inserir mesa:", mesaError?.message);
    return { ok: false, error: "Não deu pra criar a mesa. Tente de novo em instantes." };
  }

  const { error: perguntasError } = await supabase
    .from("mesa_perguntas")
    .insert(perguntasFixas(mesa.id));

  if (perguntasError) {
    console.error("[criarMesaPresencial] erro ao semear perguntas fixas:", perguntasError.message);
  }

  revalidatePath("/presencial-bh");
  return { ok: true, slug };
}
