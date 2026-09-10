"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { idadeEmAnos } from "@/lib/idade";
import { limiteIdadeClassificacao } from "@/lib/mesas/labels";

const schema = z.object({
  mesaId: z.string().uuid(),
  slug: z.string().min(1),
  respostas: z.array(z.object({ perguntaId: z.string().uuid(), resposta: z.string().trim().min(1) })),
});

export type CriarCandidaturaResult = { ok: true } | { ok: false; error: string };

export async function criarCandidatura(input: unknown): Promise<CriarCandidaturaResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Preencha todas as respostas obrigatórias." };
  }
  const { mesaId, slug, respostas } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Você precisa estar logado pra se candidatar." };
  }

  const [{ data: mesa }, { data: perfil }, { data: perguntas }] = await Promise.all([
    supabase
      .from("mesas")
      .select("classificacao, vagas_total, vagas_preenchidas, mestre_id")
      .eq("id", mesaId)
      .single(),
    supabase.from("profiles").select("data_nascimento").eq("id", user.id).single(),
    supabase.from("mesa_perguntas").select("id, obrigatoria").eq("mesa_id", mesaId),
  ]);

  if (!mesa) {
    // Sem conseguir ler a classificação da mesa, não dá pra confirmar a
    // idade mínima — nunca deixa passar nesse caso (gating no servidor
    // tem que falhar fechado, nunca aberto).
    return { ok: false, error: "Não deu pra confirmar essa mesa agora. Tente de novo em instantes." };
  }

  if (mesa.mestre_id === user.id) {
    return { ok: false, error: "Você é o mestre dessa mesa — não dá pra se candidatar a ela." };
  }

  if (mesa.vagas_preenchidas >= mesa.vagas_total) {
    return { ok: false, error: "Essa mesa já está com todas as vagas preenchidas." };
  }

  const limite = limiteIdadeClassificacao(mesa.classificacao);
  const idade = perfil ? idadeEmAnos(perfil.data_nascimento) : -1;
  if (limite > 0 && idade < limite) {
    return {
      ok: false,
      error: `Esta mesa é classificada para +${limite} anos. Sua conta não atende essa idade mínima.`,
    };
  }

  const idsRespondidos = new Set(respostas.map((r) => r.perguntaId));
  const faltaObrigatoria = (perguntas ?? []).some(
    (p) => p.obrigatoria && !idsRespondidos.has(p.id),
  );
  if (faltaObrigatoria) {
    return { ok: false, error: "Preencha todas as respostas obrigatórias." };
  }

  const { data: inscricao, error: inscricaoError } = await supabase
    .from("inscricoes")
    .insert({ mesa_id: mesaId, usuario_id: user.id })
    .select("id")
    .single();

  if (inscricaoError || !inscricao) {
    if (inscricaoError?.code === "23505") {
      return { ok: false, error: "Você já se candidatou a esta mesa." };
    }
    console.error("[criarCandidatura] erro ao criar inscrição:", inscricaoError?.message);
    return { ok: false, error: "Não deu pra enviar a candidatura. Tente de novo em instantes." };
  }

  if (respostas.length > 0) {
    const { error: respostasError } = await supabase.from("inscricao_respostas").insert(
      respostas.map((r) => ({
        inscricao_id: inscricao.id,
        pergunta_id: r.perguntaId,
        resposta: r.resposta,
      })),
    );
    if (respostasError) {
      console.error("[criarCandidatura] erro ao salvar respostas:", respostasError.message);
      // As respostas incluem linhas e véus — não pode reportar sucesso e
      // deixar isso silenciosamente sem salvar. Desfaz a inscrição (sem
      // isso o jogador fica "candidatado" mas o mestre nunca vê a ficha)
      // e pede pra tentar de novo, em vez de mentir que deu certo.
      await supabase.from("inscricoes").delete().eq("id", inscricao.id);
      return { ok: false, error: "Não deu pra salvar suas respostas. Tente de novo em instantes." };
    }
  }

  await notificarMestre(mesaId, slug, user.id);

  revalidatePath(`/mesas/${slug}`);
  return { ok: true };
}

export type SairDaMesaResult = { ok: true } | { ok: false; error: string };

/**
 * A policy de UPDATE em `inscricoes` só permite o mestre da mesa (ou admin)
 * avaliar candidatura — de propósito, pra jogador não poder se auto-aprovar.
 * Por isso o jogador sair da própria mesa também precisa de service_role:
 * a checagem de "essa inscrição é mesmo sua, e está aprovada" acontece aqui
 * no código antes de qualquer escrita, não fica pela RLS.
 */
export async function sairDaMesaAction(
  inscricaoId: string,
  slug: string,
): Promise<SairDaMesaResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Você precisa estar logado." };
  }

  const admin = serviceRole();
  const { data: inscricao } = await admin
    .from("inscricoes")
    .select("usuario_id, status, mesa_id")
    .eq("id", inscricaoId)
    .single();

  if (!inscricao || inscricao.usuario_id !== user.id) {
    return { ok: false, error: "Candidatura não encontrada." };
  }
  if (inscricao.status !== "aprovado") {
    return { ok: false, error: "Essa candidatura não está mais ativa." };
  }

  const { error } = await admin
    .from("inscricoes")
    .update({ status: "cancelada_jogador", cancelado_em: new Date().toISOString() })
    .eq("id", inscricaoId);

  if (error) {
    console.error("[sairDaMesaAction] erro:", error.message);
    return { ok: false, error: "Não deu pra sair da mesa agora. Tente de novo em instantes." };
  }

  await notificarMestre(inscricao.mesa_id, slug, user.id, "jogador_saiu");

  revalidatePath(`/mesas/${slug}`);
  revalidatePath("/conta");
  return { ok: true };
}

/**
 * O jogador não tem (nem deveria ter) permissão de RLS pra inserir uma
 * notificação na conta de outra pessoa (o mestre) — daí o service_role
 * aqui: é uma notificação de sistema disparada por uma ação já validada
 * acima (candidatura criada/cancelada de verdade), não conteúdo livre do
 * jogador.
 */
async function notificarMestre(
  mesaId: string,
  slug: string,
  candidatoId: string,
  tipo: "nova_candidatura" | "jogador_saiu" = "nova_candidatura",
) {
  const admin = serviceRole();

  const { data: mesa } = await admin
    .from("mesas")
    .select("titulo, mestre_id")
    .eq("id", mesaId)
    .single();
  if (!mesa) return;

  const { data: candidato } = await admin
    .from("profiles")
    .select("nome_exibicao")
    .eq("id", candidatoId)
    .single();

  const nome = candidato?.nome_exibicao ?? "Alguém";
  const { error } = await admin.from("notificacoes").insert({
    usuario_id: mesa.mestre_id,
    tipo,
    titulo: tipo === "nova_candidatura" ? "Nova candidatura" : "Uma vaga abriu",
    corpo:
      tipo === "nova_candidatura"
        ? `${nome} se candidatou pra "${mesa.titulo}".`
        : `${nome} saiu de "${mesa.titulo}" — uma vaga abriu de novo.`,
    url: tipo === "nova_candidatura" ? `/admin/mesas/${mesaId}` : `/mesas/${slug}`,
  });

  if (error) {
    console.error("[notificarMestre] erro ao criar notificação:", error.message);
  }
}
