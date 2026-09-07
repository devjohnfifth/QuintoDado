"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath(`/mesas/${slug}`);
  return { ok: true };
}
