import { serviceRole } from "@/lib/supabase/service-role";

/**
 * Avisa quem já está aprovado quando data/horário de uma mesa muda — só
 * chamar depois de confirmar que a data/horário realmente mudou (ver
 * atualizarMesaAction/atualizarMesaPresencialAction), pra não notificar
 * à toa numa edição que só corrigiu a sinopse.
 */
export async function notificarJogadoresAprovadosSobreReagendamento(mesaId: string) {
  const admin = serviceRole();

  const [{ data: mesa }, { data: inscricoes }] = await Promise.all([
    admin.from("mesas").select("titulo, slug, data_inicio, horario_inicio").eq("id", mesaId).single(),
    admin.from("inscricoes").select("usuario_id").eq("mesa_id", mesaId).eq("status", "aprovado"),
  ]);
  if (!mesa || !inscricoes || inscricoes.length === 0) return;

  const dataFormatada = new Date(`${mesa.data_inicio}T00:00:00`).toLocaleDateString("pt-BR");

  const { error } = await admin.from("notificacoes").insert(
    inscricoes.map((i) => ({
      usuario_id: i.usuario_id,
      tipo: "mesa_reagendada",
      titulo: "O horário de uma mesa mudou",
      corpo: `"${mesa.titulo}" agora é em ${dataFormatada} às ${mesa.horario_inicio.slice(0, 5)}. Confere se ainda encaixa na sua agenda.`,
      url: `/mesas/${mesa.slug}`,
    })),
  );

  if (error) {
    console.error("[notificarJogadoresAprovadosSobreReagendamento] erro:", error.message);
  }
}
