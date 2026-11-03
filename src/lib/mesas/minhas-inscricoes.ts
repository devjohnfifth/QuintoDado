import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

/** Status de inscrição que o card mostra. Os demais não mudam nada na lista. */
export type SituacaoNaMesa = "candidatura_enviada" | "aprovado";

/**
 * Em quais mesas da lista a pessoa logada já se candidatou.
 *
 * Sem isso, quem navega vê o mesmo card de sempre numa mesa onde já aplicou e
 * acaba se candidatando de novo (ou desistindo de procurar). Uma consulta só
 * pra lista inteira; pra quem está deslogado nem vai ao banco.
 *
 * Memoizada por requisição: a home pede para a lista dela e o `/mesas` para a
 * dele, mas cada página chama uma vez só.
 */
export const minhasInscricoes = cache(
  async (mesaIds: string[]): Promise<Map<string, SituacaoNaMesa>> => {
    const vazio = new Map<string, SituacaoNaMesa>();
    if (!isSupabaseConfigured() || mesaIds.length === 0) return vazio;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return vazio;

    const { data, error } = await supabase
      .from("inscricoes")
      .select("mesa_id, status")
      .eq("usuario_id", user.id)
      .in("mesa_id", mesaIds)
      .in("status", ["candidatura_enviada", "aprovado"]);

    if (error) {
      // Falhar aqui não pode derrubar a listagem: o card só perde o selo.
      console.error("[mesas] erro ao buscar inscrições:", error.message);
      return vazio;
    }

    return new Map(data.map((i) => [i.mesa_id as string, i.status as SituacaoNaMesa]));
  },
);
