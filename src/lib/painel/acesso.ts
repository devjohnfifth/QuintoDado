import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

/**
 * O que a pessoa é dentro deste painel.
 *
 * `espectador` é quem tem conta no site mas não joga nesta mesa: lê o que
 * já foi revelado e não escreve nada. Mestre e jogador escrevem.
 */
export type PapelNoPainel = "mestre" | "jogador" | "espectador";

/** Mesa que já está no ar — mesma lista da policy `mesa_leitura`. */
const MESA_NO_AR = ["publicada", "confirmada", "em_andamento"];

export type AcessoPainel = {
  mesa: { id: string; slug: string; titulo: string; tipo: string; banner_url: string | null };
  usuarioId: string;
  ehMestre: boolean;
  papel: PapelNoPainel;
  /** Mestre e jogador criam ficha e resumo; espectador só lê. */
  podeCriar: boolean;
};

/**
 * Quem pode abrir o painel de uma mesa: o mestre dela (ou admin), quem tem
 * inscrição aprovada e — desde que a mesa já esteja no ar — qualquer pessoa
 * com conta no site. Devolve `null` pra visitante deslogado e pra mesa que
 * ainda não foi publicada, e a página responde 404: dizer "sem permissão"
 * já confirma que a mesa existe e que há algo ali dentro.
 *
 * É a checagem de mensagem clara; a garantia de verdade é o RLS
 * (`pode_ver_painel()` na leitura, `eh_membro_da_mesa()` na escrita).
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
    .select("id, slug, titulo, tipo, banner_url, mestre_id, status")
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
  const papel: PapelNoPainel = ehMestre ? "mestre" : inscricao ? "jogador" : "espectador";

  // Painel de mesa que ainda não foi ao ar (rascunho, aguardando aprovação)
  // ou que foi cancelada continua fechado a quem não é dela.
  if (papel === "espectador" && !MESA_NO_AR.includes(mesa.status)) return null;

  return {
    mesa: { id: mesa.id, slug: mesa.slug, titulo: mesa.titulo, tipo: mesa.tipo, banner_url: mesa.banner_url },
    usuarioId: user.id,
    ehMestre,
    papel,
    podeCriar: papel !== "espectador",
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
 *
 * O `podeCriar` não é detalhe: desde que o painel abriu pra quem tem conta,
 * `acessoAoPainel` passou a devolver acesso pra espectador também. Sem esta
 * linha, bastava chamar a Server Action direto pra tentar escrever numa mesa
 * de outra pessoa — o RLS recusaria, mas a recusa viria como erro feio de
 * banco em vez de mensagem, e a regra ficaria num lugar só.
 */
export async function exigirMembroDaMesa(slug: string) {
  const acesso = await acessoAoPainel(slug);
  if (!acesso) throw new Error("Mesa não encontrada.");
  if (!acesso.podeCriar) throw new Error("Só quem joga nesta mesa pode escrever no painel dela.");
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
