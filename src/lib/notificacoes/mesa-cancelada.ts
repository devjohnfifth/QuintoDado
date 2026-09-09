import { serviceRole } from "@/lib/supabase/service-role";

/**
 * Compartilhado entre o cancelamento de mesa pelo admin e pelo mestre —
 * avisa todo jogador com candidatura aprovada que a mesa que ele
 * confirmou presença sumiu. Sem isso, o jogador só descobre chegando
 * na hora e não achando ninguém.
 */
export async function notificarJogadoresAprovadosSobreCancelamento(mesaId: string) {
  const admin = serviceRole();

  const [{ data: mesa }, { data: inscricoes }] = await Promise.all([
    admin.from("mesas").select("titulo").eq("id", mesaId).single(),
    admin.from("inscricoes").select("usuario_id").eq("mesa_id", mesaId).eq("status", "aprovado"),
  ]);
  if (!mesa || !inscricoes || inscricoes.length === 0) return;

  const { error } = await admin.from("notificacoes").insert(
    inscricoes.map((i) => ({
      usuario_id: i.usuario_id,
      tipo: "mesa_cancelada",
      titulo: "Uma mesa que você ia jogar foi cancelada",
      corpo: `"${mesa.titulo}" foi cancelada. Sentimos muito — fica de olho em outras mesas abertas.`,
      url: "/mesas",
    })),
  );

  if (error) {
    console.error("[notificarJogadoresAprovadosSobreCancelamento] erro:", error.message);
  }
}
