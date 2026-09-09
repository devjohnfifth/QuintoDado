"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { slugify } from "@/lib/slugify";
import { perguntasFixas } from "@/lib/mesas/perguntas-fixas";
import { hojeNoBrasil } from "@/lib/mesas/horario";

/**
 * Sem isso, uma mesa presencial nova ficava em "aguardando_aprovacao"
 * sem avisar ninguém — o admin só descobria olhando o painel por
 * conta própria. Notifica todo profile com papel admin (hoje só tem
 * um, mas não trava em um id fixo).
 */
async function notificarAdminsSobreMesaPendente(mesaId: string, titulo: string, mestreNome: string) {
  const admin = serviceRole();
  const { data: admins } = await admin.from("profiles").select("id").eq("papel", "admin");
  if (!admins || admins.length === 0) return;

  const { error } = await admin.from("notificacoes").insert(
    admins.map((a) => ({
      usuario_id: a.id,
      tipo: "mesa_aguardando_aprovacao",
      titulo: "Mesa nova aguardando aprovação",
      corpo: `${mestreNome} criou "${titulo}" — precisa da sua aprovação pra ficar pública.`,
      url: `/admin/mesas/${mesaId}`,
    })),
  );
  if (error) {
    console.error("[notificarAdminsSobreMesaPendente] erro:", error.message);
  }
}

const schema = z
  .object({
    titulo: z.string().trim().min(3, "Título muito curto.").max(120),
    sistemaId: z.string().uuid("Escolha um sistema."),
    sistemaOutroNome: z.string().trim().max(60).optional(),
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
  })
  .refine((d) => d.dataInicio >= hojeNoBrasil(), {
    message: "A data de início não pode ser no passado.",
    path: ["dataInicio"],
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
    .select("papel, nome_exibicao")
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

  // "Outro" é uma linha real em `sistemas` (sem logo fixo) — confere pelo
  // slug no servidor, não confia só no que o cliente disse ser "outro".
  const { data: sistemaEscolhido } = await supabase
    .from("sistemas")
    .select("slug")
    .eq("id", dados.sistemaId)
    .single();
  if (sistemaEscolhido?.slug === "outro" && !dados.sistemaOutroNome) {
    return { ok: false, error: "Escreva o nome do sistema." };
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
      sistema_outro: sistemaEscolhido?.slug === "outro" ? dados.sistemaOutroNome : null,
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

  await notificarAdminsSobreMesaPendente(mesa.id, dados.titulo, perfil.nome_exibicao);

  revalidatePath("/presencial-bh");
  return { ok: true, slug };
}

export type AtualizarMesaPresencialResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/**
 * Só o próprio mestre dono edita a mesa dele por aqui (não o admin — o
 * admin já tem /admin/mesas/[id]/editar, que cobre toda mesa,
 * presencial ou não). Assim como a versão do admin: não mexe em
 * status/aprovada_por/slug, e não deixa reduzir vagas abaixo de quem já
 * foi aprovado.
 */
export async function atualizarMesaPresencialAction(
  mesaId: string,
  input: unknown,
): Promise<AtualizarMesaPresencialResult> {
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

  const { data: mesaAtual } = await supabase
    .from("mesas")
    .select("slug, mestre_id, vagas_preenchidas")
    .eq("id", mesaId)
    .single();
  if (!mesaAtual || mesaAtual.mestre_id !== user.id) {
    return { ok: false, error: "Mesa não encontrada." };
  }
  if (dados.vagasTotal < mesaAtual.vagas_preenchidas) {
    return {
      ok: false,
      error: `Já tem ${mesaAtual.vagas_preenchidas} jogador(es) aprovado(s) — não dá pra reduzir o total de vagas abaixo disso.`,
    };
  }

  const precoCentavos = dados.gratuita ? 0 : Math.round((dados.valorReais ?? 0) * 100);
  if (!dados.gratuita && precoCentavos > 0 && precoCentavos < 500) {
    return {
      ok: false,
      error: "O valor sugerido precisa ser R$5,00 ou mais (ou marque como gratuita).",
    };
  }

  const { data: sistemaEscolhido } = await supabase
    .from("sistemas")
    .select("slug")
    .eq("id", dados.sistemaId)
    .single();
  if (sistemaEscolhido?.slug === "outro" && !dados.sistemaOutroNome) {
    return { ok: false, error: "Escreva o nome do sistema." };
  }

  const { error } = await supabase
    .from("mesas")
    .update({
      titulo: dados.titulo,
      sinopse: dados.sinopse,
      sistema_id: dados.sistemaId,
      sistema_outro: sistemaEscolhido?.slug === "outro" ? dados.sistemaOutroNome : null,
      cidade_uf: dados.cidadeUf,
      classificacao: dados.classificacao,
      nivel_experiencia: dados.nivelExperiencia,
      vagas_total: dados.vagasTotal,
      min_jogadores: dados.minJogadores,
      preco_centavos: precoCentavos,
      data_inicio: dados.dataInicio,
      horario_inicio: dados.horarioInicio,
      horario_fim: dados.horarioFim,
      banner_url: dados.bannerUrl || null,
    })
    .eq("id", mesaId);

  if (error) {
    console.error("[atualizarMesaPresencialAction] erro:", error.message);
    return { ok: false, error: "Não deu pra salvar as alterações. Tente de novo." };
  }

  revalidatePath("/presencial-bh");
  revalidatePath(`/mesas/${mesaAtual.slug}`);
  return { ok: true, slug: mesaAtual.slug };
}
