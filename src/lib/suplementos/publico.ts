import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Dado, Tabela } from "@/lib/suplementos/dados";

export type SuplementoCardData = {
  slug: string;
  titulo: string;
  resumo: string;
  tipo: string;
  capa_url: string | null;
  classificacao: string;
  publicado: boolean;
  sistemas: { nome: string; slug: string } | null;
};

export async function listarSuplementos(): Promise<SuplementoCardData[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const query = supabase
    .from("suplementos")
    .select("slug, titulo, resumo, tipo, capa_url, classificacao, publicado, sistemas(nome, slug)")
    .eq("gratuito", true)
    .order("publicado_em", { ascending: false, nullsFirst: true })
    .order("criado_em", { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error("[suplementos] erro ao listar:", error.message);
    return [];
  }

  return data as unknown as SuplementoCardData[];
}

export const buscarSuplemento = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: s, error } = await supabase
    .from("suplementos")
    .select(
      "id, slug, titulo, resumo, descricao_md, tipo, capa_url, classificacao, usa_ia, licenca_base, atribuicao, publicado, publicado_em, downloads_count, sistemas(nome, slug)",
    )
    .eq("slug", slug)
    .eq("gratuito", true)
    .maybeSingle();

  if (error) console.error("[suplementos/slug] erro:", error.message);
  if (!s) return null;

  const [{ data: arquivos, error: arqError }, { data: tabelasDb, error: tabError }] = await Promise.all([
    supabase
      .from("arquivos_suplemento")
      .select("id, nome, formato, tamanho_bytes")
      .eq("suplemento_id", s.id)
      .is("removido_em", null)
      .order("ordem"),
    supabase
      .from("tabelas_aleatorias")
      .select("id, titulo, dado, colunas, tabela_itens!tabela_itens_tabela_id_fkey(faixa_min, faixa_max, valores, tabela_aninhada_id)")
      .eq("suplemento_id", s.id)
      .order("ordem"),
  ]);
  if (arqError) console.error("[suplementos/slug] arquivos:", arqError.message);
  if (tabError) console.error("[suplementos/slug] tabelas:", tabError.message);

  const tabelas: Tabela[] = (tabelasDb ?? []).map((t) => {
    const itens = (t.tabela_itens as unknown as {
      faixa_min: number;
      faixa_max: number;
      valores: string[];
      tabela_aninhada_id: string | null;
    }[]) ?? [];
    return {
      chave: t.id,
      titulo: t.titulo,
      dado: t.dado as Dado,
      colunas: t.colunas,
      itens: itens
        .sort((a, b) => a.faixa_min - b.faixa_min)
        .map((i) => ({ faixaMin: i.faixa_min, faixaMax: i.faixa_max, valores: i.valores, aninhada: i.tabela_aninhada_id })),
    };
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    suplemento: { ...s, sistemas: s.sistemas as unknown as { nome: string; slug: string } | null },
    arquivos: arquivos ?? [],
    tabelas,
    logado: Boolean(user),
  };
});
