"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";

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
    }
  }

  await notificarMestre(mesaId, slug, user.id);

  revalidatePath(`/mesas/${slug}`);
  return { ok: true };
}

/**
 * O jogador não tem (nem deveria ter) permissão de RLS pra inserir uma
 * notificação na conta de outra pessoa (o mestre) — daí o service_role
 * aqui: é uma notificação de sistema disparada por uma ação já validada
 * acima (candidatura criada de verdade), não conteúdo livre do jogador.
 */
async function notificarMestre(mesaId: string, slug: string, candidatoId: string) {
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

  const { error } = await admin.from("notificacoes").insert({
    usuario_id: mesa.mestre_id,
    tipo: "nova_candidatura",
    titulo: "Nova candidatura",
    corpo: `${candidato?.nome_exibicao ?? "Alguém"} se candidatou pra "${mesa.titulo}".`,
    url: `/admin/mesas/${mesaId}`,
  });

  if (error) {
    console.error("[notificarMestre] erro ao criar notificação:", error.message);
  }
}
