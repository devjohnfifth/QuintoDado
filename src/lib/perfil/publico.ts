import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { MesaCardData } from "@/components/site/mesa-card";

/**
 * Leitura do perfil público (`/u/[username]`).
 *
 * Quem filtra "é público ou não" é o banco, não daqui: a policy
 * `perfil_leitura_publica` é `using (perfil_publico or id = auth.uid() or
 * eh_admin())`. Então perfil fechado simplesmente não volta na consulta e a
 * página responde 404 — não existe caminho em que a tela receba o dado e
 * decida esconder.
 *
 * Efeito colateral que vale saber: fechar o perfil some com o nome da pessoa
 * em TODO lugar que faz join em `profiles`, inclusive no "mestrada por" dos
 * cards. Não é bug, é a policy; o texto do formulário avisa isso.
 */

export type PerfilPublico = {
  username: string;
  nomeExibicao: string;
  avatarUrl: string | null;
  bio: string | null;
  papel: string;
  criadoEm: string | null;
  sistemasFavoritos: string[];
};

/** As colunas públicas. Nome civil, telefone e data de nascimento não estão
 *  aqui — e desde a migration 20261115210000 nem são legíveis pela chave
 *  anônima, então isto é cinto e suspensório de propósito. */
const COLUNAS = "username, nome_exibicao, avatar_url, bio, papel, criado_em, sistemas_favoritos";

export const buscarPerfilPublico = cache(async (username: string): Promise<PerfilPublico | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(COLUNAS)
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("[perfil] erro ao buscar perfil público:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    username: data.username as string,
    nomeExibicao: data.nome_exibicao as string,
    avatarUrl: (data.avatar_url as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    papel: (data.papel as string) ?? "usuario",
    criadoEm: (data.criado_em as string | null) ?? null,
    sistemasFavoritos: (data.sistemas_favoritos as string[] | null) ?? [],
  };
});

/** Os nomes dos sistemas favoritos, na ordem do catálogo. */
export const nomesDeSistemas = cache(async (ids: string[]): Promise<string[]> => {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("sistemas").select("nome").in("id", ids).order("nome");
  if (error) {
    console.error("[perfil] erro ao buscar sistemas:", error.message);
    return [];
  }
  return (data ?? []).map((s) => s.nome as string);
});

/**
 * As mesas que a pessoa mestra e que estão no ar.
 *
 * Mesmo `in(status)` da listagem pública: é a definição de "mesa pública" que
 * o resto do site usa. Rascunho e mesa em análise não aparecem pra ninguém
 * aqui, nem pro dono do perfil — esta página é a vitrine, não o painel dele.
 */
export const mesasDoMestre = cache(async (username: string): Promise<MesaCardData[]> => {
  const supabase = await createClient();

  const { data: perfil } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!perfil) return [];

  const { data, error } = await supabase
    .from("mesas")
    .select(
      "sistema_id, id, slug, titulo, sinopse, tipo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, link_externo, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo), profiles!mesas_mestre_id_fkey(nome_exibicao, avatar_url)",
    )
    .eq("mestre_id", perfil.id as string)
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[perfil] erro ao buscar mesas do mestre:", error.message);
    return [];
  }
  return (data ?? []) as unknown as MesaCardData[];
});
