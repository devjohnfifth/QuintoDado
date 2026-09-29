import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Entidade } from "@/lib/painel/tipos";

/**
 * Leitura do painel. Nenhuma destas funções filtra por visibilidade: quem
 * filtra é o RLS, no banco. Se um campo oculto chegasse até aqui, já teria
 * vazado — por isso o teste do lote é `curl` com token de jogador, não a tela.
 */

export async function listarEntidades(mesaId: string): Promise<Entidade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("painel_entidades")
    .select("id, tipo, nome, imagem_url, oculta, ordem, painel_campos(id, rotulo, valor, ordem, vis, revelado_para)")
    .eq("mesa_id", mesaId)
    .order("ordem")
    .order("nome");

  if (error) {
    console.error("[painel] erro ao listar entidades:", error.message);
    return [];
  }

  return (data ?? []).map((e) => ({
    ...e,
    painel_campos: [...(e.painel_campos ?? [])].sort((a, b) => a.ordem - b.ordem),
  })) as unknown as Entidade[];
}

export type Sessao = {
  id: string;
  numero: number;
  data: string | null;
  resumo_md: string | null;
  publicado: boolean;
};

export async function listarSessoes(mesaId: string): Promise<Sessao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("painel_sessoes")
    .select("id, numero, data, resumo_md, publicado")
    .eq("mesa_id", mesaId)
    .order("numero", { ascending: false });

  if (error) {
    console.error("[painel] erro ao listar sessões:", error.message);
    return [];
  }
  return (data ?? []) as Sessao[];
}
