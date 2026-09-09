import { serviceRole } from "@/lib/supabase/service-role";

/**
 * Compartilhado entre a revisão de candidatura do admin e a do mestre —
 * o jogador nunca é dono da notificação que a gente cria pra ele (é
 * quem aprova/recusa que aciona), então a policy `notificacao_propria`
 * (só o dono escreve) bloquearia um insert com o client normal. Por
 * isso sempre via service_role, igual `notificarMestre` faz pro
 * caminho inverso.
 */
export async function notificarJogadorSobreCandidatura(
  inscricaoId: string,
  tipo: "aprovado" | "recusado",
  motivo?: string,
) {
  const admin = serviceRole();

  const { data: inscricao } = await admin
    .from("inscricoes")
    .select("usuario_id, mesas(titulo, slug)")
    .eq("id", inscricaoId)
    .single();
  if (!inscricao) return;

  const mesa = inscricao.mesas as unknown as { titulo: string; slug: string } | null;
  if (!mesa) return;

  const corpoRecusa = motivo
    ? `Sua candidatura pra "${mesa.titulo}" não foi aprovada dessa vez. Motivo: ${motivo}`
    : `Sua candidatura pra "${mesa.titulo}" não foi aprovada dessa vez.`;

  const { error } = await admin.from("notificacoes").insert({
    usuario_id: inscricao.usuario_id,
    tipo: tipo === "aprovado" ? "candidatura_aprovada" : "candidatura_recusada",
    titulo: tipo === "aprovado" ? "Candidatura aprovada!" : "Candidatura não aprovada",
    corpo:
      tipo === "aprovado"
        ? `Você foi aprovado pra "${mesa.titulo}"! Confira os detalhes.`
        : corpoRecusa,
    url: `/mesas/${mesa.slug}`,
  });

  if (error) {
    console.error("[notificarJogadorSobreCandidatura] erro ao criar notificação:", error.message);
  }
}
