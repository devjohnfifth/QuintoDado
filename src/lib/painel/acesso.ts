import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type AcessoPainel = {
  mesa: { id: string; slug: string; titulo: string; tipo: string; banner_url: string | null };
  usuarioId: string;
  ehMestre: boolean;
};

/**
 * Quem pode abrir o painel de uma mesa: o mestre dela (ou admin) e quem tem
 * inscrição aprovada. Devolve `null` pra qualquer outro caso — a página
 * responde 404, porque dizer "sem permissão" já confirma que a mesa existe
 * e que há algo ali dentro.
 *
 * É a checagem de mensagem clara; a garantia de verdade é o RLS
 * (`eh_membro_da_mesa()` nas policies do painel).
 */
export const acessoAoPainel = cache(async (slug: string): Promise<AcessoPainel | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mesa, error } = await supabase
    .from("mesas")
    .select("id, slug, titulo, tipo, banner_url, mestre_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("[painel] erro ao buscar mesa:", error.message);
  if (!mesa) return null;

  const [{ data: perfil }, { data: inscricao }] = await Promise.all([
    supabase.from("profiles").select("papel").eq("id", user.id).maybeSingle(),
    supabase
      .from("inscricoes")
      .select("id")
      .eq("mesa_id", mesa.id)
      .eq("usuario_id", user.id)
      .eq("status", "aprovado")
      .maybeSingle(),
  ]);

  const ehMestre = mesa.mestre_id === user.id || perfil?.papel === "admin";
  if (!ehMestre && !inscricao) return null;

  return {
    mesa: { id: mesa.id, slug: mesa.slug, titulo: mesa.titulo, tipo: mesa.tipo, banner_url: mesa.banner_url },
    usuarioId: user.id,
    ehMestre,
  };
});

/** Usada pelas Server Actions do mestre: recusa quem não mestra a mesa. */
export async function exigirMestreDaMesa(slug: string) {
  const acesso = await acessoAoPainel(slug);
  if (!acesso) throw new Error("Mesa não encontrada.");
  if (!acesso.ehMestre) throw new Error("Só quem mestra esta mesa pode fazer isso.");
  const supabase = await createClient();
  return { supabase, mesaId: acesso.mesa.id, usuarioId: acesso.usuarioId };
}

/**
 * Usada pelas Server Actions que o jogador também pode chamar (criar ficha
 * visível, registrar resumo de sessão). A garantia continua sendo o RLS; isto
 * aqui só dá erro claro e diz se quem chamou é o mestre.
 */
export async function exigirMembroDaMesa(slug: string) {
  const acesso = await acessoAoPainel(slug);
  if (!acesso) throw new Error("Mesa não encontrada.");
  const supabase = await createClient();
  return { supabase, mesaId: acesso.mesa.id, usuarioId: acesso.usuarioId, ehMestre: acesso.ehMestre };
}

/** Membros aprovados da mesa — alvo do "revelar pra jogadores específicos". */
export async function membrosDaMesa(mesaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inscricoes")
    .select("usuario_id, profiles!inscricoes_usuario_id_fkey(nome_exibicao, username, avatar_url)")
    .eq("mesa_id", mesaId)
    .eq("status", "aprovado");

  if (error) {
    console.error("[painel] erro ao buscar membros:", error.message);
    return [];
  }

  return (data ?? []).map((i) => {
    const p = i.profiles as unknown as { nome_exibicao: string; username: string; avatar_url: string | null } | null;
    return {
      id: i.usuario_id as string,
      nome: p?.nome_exibicao ?? "Jogador",
      username: p?.username ?? "",
      avatarUrl: p?.avatar_url ?? null,
    };
  });
}
