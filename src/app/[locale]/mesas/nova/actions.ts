"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { slugify } from "@/lib/slugify";
import { perguntasFixas } from "@/lib/mesas/perguntas-fixas";
import { schemaMesaDoMestre, precoEmCentavos } from "@/lib/mesas/schema-mesa-mestre";
import { notificarJogadoresAprovadosSobreReagendamento } from "@/lib/notificacoes/mesa-reagendada";
import { notificarAdminsSobreSolicitacaoMestre } from "@/lib/notificacoes/solicitacao-mestre";

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

export type CriarMesaDoMestreResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/**
 * Criação de mesa pelo próprio mestre, online ou presencial.
 *
 * O que mantém isso fora do Conflito A (§5.1) é `cobranca_gerenciada_pelo_site:
 * false` — o site nunca processa o dinheiro dessas mesas, o valor é só
 * informativo e combinado fora. Mesa online comissionada continua sendo só do
 * admin. Essas duas travas (cobrança e `aguardando_aprovacao`) também vivem na
 * policy `mesa_cria`, então não dependem desta função.
 */
export async function criarMesaDoMestre(
  input: unknown,
): Promise<CriarMesaDoMestreResult> {
  const parsed = schemaMesaDoMestre.safeParse(input);
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

  const preco = precoEmCentavos(dados);
  if (!preco.ok) return { ok: false, error: preco.error };
  const precoCentavos = preco.centavos;

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
      tipo: dados.tipo,
      modalidade: dados.modalidade,
      // Cada modalidade zera os campos da outra: mesa que troca de modalidade
      // numa edição não pode ficar com cidade órfã nem com VTT fantasma.
      cidade_uf: dados.modalidade === "presencial" ? dados.cidadeUf : null,
      plataforma_vtt: dados.modalidade === "online" ? dados.plataformaVtt || null : null,
      plataforma_voz: dados.modalidade === "online" ? dados.plataformaVoz || null : null,
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
    console.error("[criarMesaDoMestre] erro ao inserir mesa:", mesaError?.message);
    return { ok: false, error: "Não deu pra criar a mesa. Tente de novo em instantes." };
  }

  const { error: perguntasError } = await supabase
    .from("mesa_perguntas")
    .insert(perguntasFixas(mesa.id));

  if (perguntasError) {
    console.error("[criarMesaDoMestre] erro ao semear perguntas fixas:", perguntasError.message);
  }

  await notificarAdminsSobreMesaPendente(mesa.id, dados.titulo, perfil.nome_exibicao);

  revalidatePath("/mesas");
  revalidatePath("/presencial");
  return { ok: true, slug };
}

export type AtualizarMesaDoMestreResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/**
 * Só o próprio mestre dono edita a mesa dele por aqui (não o admin — o
 * admin já tem /admin/mesas/[id]/editar, que cobre toda mesa,
 * presencial ou não). Assim como a versão do admin: não mexe em
 * status/aprovada_por/slug, e não deixa reduzir vagas abaixo de quem já
 * foi aprovado.
 */
export async function atualizarMesaDoMestreAction(
  mesaId: string,
  input: unknown,
): Promise<AtualizarMesaDoMestreResult> {
  const parsed = schemaMesaDoMestre.safeParse(input);
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
    .select("slug, mestre_id, vagas_preenchidas, data_inicio, horario_inicio, horario_fim, status")
    .eq("id", mesaId)
    .single();
  if (!mesaAtual || mesaAtual.mestre_id !== user.id) {
    return { ok: false, error: "Mesa não encontrada." };
  }
  if (mesaAtual.status === "cancelada") {
    return { ok: false, error: "Essa mesa já foi cancelada — não dá mais pra editar." };
  }
  // Postgres devolve horário com segundos ("08:22:00"), o form manda só
  // HH:MM — normaliza os dois antes de comparar.
  const horarioMudou =
    mesaAtual.data_inicio !== dados.dataInicio ||
    mesaAtual.horario_inicio.slice(0, 5) !== dados.horarioInicio ||
    mesaAtual.horario_fim.slice(0, 5) !== dados.horarioFim;
  if (dados.vagasTotal < mesaAtual.vagas_preenchidas) {
    return {
      ok: false,
      error: `Já tem ${mesaAtual.vagas_preenchidas} jogador(es) aprovado(s) — não dá pra reduzir o total de vagas abaixo disso.`,
    };
  }

  const preco = precoEmCentavos(dados);
  if (!preco.ok) return { ok: false, error: preco.error };
  const precoCentavos = preco.centavos;

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
      tipo: dados.tipo,
      modalidade: dados.modalidade,
      cidade_uf: dados.modalidade === "presencial" ? dados.cidadeUf : null,
      plataforma_vtt: dados.modalidade === "online" ? dados.plataformaVtt || null : null,
      plataforma_voz: dados.modalidade === "online" ? dados.plataformaVoz || null : null,
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
    console.error("[atualizarMesaDoMestreAction] erro:", error.message);
    return { ok: false, error: "Não deu pra salvar as alterações. Tente de novo." };
  }

  if (horarioMudou) {
    await notificarJogadoresAprovadosSobreReagendamento(mesaId);
  }

  revalidatePath("/mesas");
  revalidatePath("/presencial");
  revalidatePath(`/mesas/${mesaAtual.slug}`);
  return { ok: true, slug: mesaAtual.slug };
}

export type SolicitarMestreResult = { ok: true } | { ok: false; error: string };

/**
 * CTA no gate de /mesas/nova pra quem ainda não é mestre. Não
 * promove ninguém sozinho — só avisa os admins, que promovem pelo
 * painel (/admin/usuarios) depois de conferir o perfil.
 */
export async function solicitarMestreAction(): Promise<SolicitarMestreResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Você precisa estar logado." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel, nome_exibicao, mestre_solicitado_em")
    .eq("id", user.id)
    .single();

  if (!perfil) return { ok: false, error: "Perfil não encontrado." };
  if (perfil.papel !== "usuario") return { ok: false, error: "Você já tem acesso pra criar mesas." };
  if (perfil.mestre_solicitado_em) return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update({ mestre_solicitado_em: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[solicitarMestreAction] erro:", error.message);
    return { ok: false, error: "Não deu pra enviar o pedido. Tente de novo." };
  }

  await notificarAdminsSobreSolicitacaoMestre(perfil.nome_exibicao);

  revalidatePath("/mesas/nova");
  return { ok: true };
}
