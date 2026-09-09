import { serviceRole } from "@/lib/supabase/service-role";

export async function notificarAdminsSobreSolicitacaoMestre(usuarioNome: string) {
  const admin = serviceRole();
  const { data: admins } = await admin.from("profiles").select("id").eq("papel", "admin");
  if (!admins || admins.length === 0) return;

  const { error } = await admin.from("notificacoes").insert(
    admins.map((a) => ({
      usuario_id: a.id,
      tipo: "solicitacao_mestre",
      titulo: "Pedido pra virar mestre presencial",
      corpo: `${usuarioNome} quer criar mesas presenciais em BH — dá uma olhada no perfil e promova pelo painel admin se fizer sentido.`,
      url: "/admin/usuarios",
    })),
  );
  if (error) {
    console.error("[notificarAdminsSobreSolicitacaoMestre] erro:", error.message);
  }
}
