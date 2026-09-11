import { serviceRole } from "@/lib/supabase/service-role";

export async function notificarAdminsSobreIngressoPendente(
  eventoId: string,
  eventoTitulo: string,
  tipoNome: string,
  compradorNome: string,
) {
  const admin = serviceRole();
  const { data: admins } = await admin.from("profiles").select("id").eq("papel", "admin");
  if (!admins || admins.length === 0) return;

  const { error } = await admin.from("notificacoes").insert(
    admins.map((a) => ({
      usuario_id: a.id,
      tipo: "ingresso_pendente",
      titulo: "Pedido de ingresso pra revisar",
      corpo: `${compradorNome} pediu o ingresso "${tipoNome}" pra "${eventoTitulo}" — confira o comprovante e aprove.`,
      url: `/admin/eventos/${eventoId}`,
    })),
  );
  if (error) {
    console.error("[notificarAdminsSobreIngressoPendente] erro:", error.message);
  }
}

export async function notificarUsuarioSobreIngresso(
  ingressoId: string,
  tipo: "aprovado" | "recusado",
  motivo?: string,
) {
  const admin = serviceRole();

  const { data: ingresso } = await admin
    .from("evento_ingressos")
    .select("usuario_id, eventos(titulo, slug)")
    .eq("id", ingressoId)
    .single();
  if (!ingresso) return;

  const evento = ingresso.eventos as unknown as { titulo: string; slug: string } | null;
  if (!evento) return;

  const corpoRecusa = motivo
    ? `Seu ingresso pra "${evento.titulo}" não foi aprovado. Motivo: ${motivo}`
    : `Seu ingresso pra "${evento.titulo}" não foi aprovado.`;

  const { error } = await admin.from("notificacoes").insert({
    usuario_id: ingresso.usuario_id,
    tipo: tipo === "aprovado" ? "ingresso_aprovado" : "ingresso_recusado",
    titulo: tipo === "aprovado" ? "Ingresso aprovado!" : "Ingresso não aprovado",
    corpo:
      tipo === "aprovado"
        ? `Seu ingresso pra "${evento.titulo}" foi confirmado. Te esperamos lá!`
        : corpoRecusa,
    url: `/eventos/${evento.slug}`,
  });

  if (error) {
    console.error("[notificarUsuarioSobreIngresso] erro:", error.message);
  }
}
