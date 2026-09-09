/**
 * TODO(Supabase): mover pra tabela `links` (ver
 * docs/Modelo-de-Dados_QuintoDado_v1.sql) e deixar ordenável pelo admin.
 * Centralizado aqui por enquanto pra não duplicar URL entre a home e /links.
 */
export const SITE_LINKS = {
  whatsappComunidade: "https://chat.whatsapp.com/C0Rmu5f3im2DYg1s5LWr8t",
  instagram: "https://www.instagram.com/quintodado/",
  mesaquest: "https://mesaquest.com.br/usuario/mestre-quintao-quinto-dado-h0pbv4vz",
  youtube: "https://www.youtube.com/@oquintodado",
  // Ainda não informado pelo operador.
  tiktok: null as string | null,
} as const;
