"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/auth/exigir-admin";
import { slugify } from "@/lib/slugify";
import { apagarObjeto, tamanhoDoObjeto, urlUploadAssinada } from "@/lib/storage/r2";
import { DADOS, validarConjunto, type Tabela } from "@/lib/suplementos/dados";
import {
  FORMATOS_ARQUIVO,
  MIME_POR_FORMATO,
  TAMANHO_MAXIMO_ARQUIVO,
  TIPOS_SUPLEMENTO,
  type FormatoArquivo,
} from "@/lib/suplementos/labels";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function primeiroErro(e: z.ZodError) {
  return e.issues[0]?.message ?? "Dados inválidos.";
}

function revalidarSuplemento(slug?: string) {
  revalidatePath("/admin/suplementos");
  revalidatePath("/suplementos");
  revalidatePath("/");
  if (slug) revalidatePath(`/suplementos/${slug}`);
}

// ---------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------

const dadosSchema = z.object({
  titulo: z.string().trim().min(3, "Título muito curto.").max(120),
  resumo: z.string().trim().min(10, "Escreva um resumo de pelo menos uma frase.").max(300),
  descricaoMd: z.string().trim().max(20000).optional(),
  tipo: z.enum(TIPOS_SUPLEMENTO),
  sistemaId: z.string().uuid().nullable(),
  classificacao: z.enum(["livre", "14", "16", "18"]),
  capaUrl: z.string().url().nullable(),
  usaIa: z.boolean(),
  licencaBase: z.string().trim().max(200).optional(),
  atribuicao: z.string().trim().max(500).optional(),
});

function paraColunas(d: z.infer<typeof dadosSchema>) {
  return {
    titulo: d.titulo,
    resumo: d.resumo,
    descricao_md: d.descricaoMd || null,
    tipo: d.tipo,
    sistema_id: d.sistemaId,
    classificacao: d.classificacao,
    capa_url: d.capaUrl,
    usa_ia: d.usaIa,
    licenca_base: d.licencaBase || null,
    atribuicao: d.atribuicao || null,
  };
}

/**
 * Slug é permanente (§15: mudar slug derruba o SEO), então nasce limpo e sem
 * sufixo aleatório; só ganha "-2", "-3"… se já existir.
 */
async function slugDisponivel(supabase: Awaited<ReturnType<typeof exigirAdmin>>["supabase"], titulo: string) {
  const base = slugify(titulo) || "suplemento";
  const { data, error } = await supabase.from("suplementos").select("slug").like("slug", `${base}%`);
  if (error) throw new Error(`Não deu pra conferir o slug: ${error.message}`);
  const usados = new Set((data ?? []).map((s) => s.slug));
  if (!usados.has(base)) return base;
  for (let n = 2; ; n++) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
}

export async function criarSuplementoAction(input: unknown): Promise<Resultado<{ id: string }>> {
  const parsed = dadosSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase } = await exigirAdmin();
  const slug = await slugDisponivel(supabase, parsed.data.titulo);

  const { data, error } = await supabase
    .from("suplementos")
    .insert({ ...paraColunas(parsed.data), slug, gratuito: true, publicado: false })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[criarSuplementoAction] erro:", error?.message);
    return { ok: false, error: "Não deu pra criar o suplemento." };
  }

  revalidarSuplemento();
  return { ok: true, id: data.id };
}

export async function atualizarSuplementoAction(id: string, input: unknown): Promise<Resultado> {
  const parsed = dadosSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase } = await exigirAdmin();
  const { data, error } = await supabase
    .from("suplementos")
    .update(paraColunas(parsed.data))
    .eq("id", id)
    .select("slug")
    .single();

  if (error || !data) {
    console.error("[atualizarSuplementoAction] erro:", error?.message);
    return { ok: false, error: "Não deu pra salvar os dados." };
  }

  revalidarSuplemento(data.slug);
  return { ok: true };
}

export async function alternarPublicacaoAction(id: string, publicar: boolean): Promise<Resultado> {
  const { supabase } = await exigirAdmin();

  const { data: atual, error: leituraError } = await supabase
    .from("suplementos")
    .select("slug, publicado_em")
    .eq("id", id)
    .single();
  if (leituraError || !atual) return { ok: false, error: "Suplemento não encontrado." };

  if (publicar) {
    const { count, error: countError } = await supabase
      .from("arquivos_suplemento")
      .select("id", { count: "exact", head: true })
      .eq("suplemento_id", id)
      .is("removido_em", null);
    const { count: tabelas, error: tabError } = await supabase
      .from("tabelas_aleatorias")
      .select("id", { count: "exact", head: true })
      .eq("suplemento_id", id);
    if (countError || tabError) return { ok: false, error: "Não deu pra conferir o conteúdo do suplemento." };
    if ((count ?? 0) === 0 && (tabelas ?? 0) === 0) {
      return { ok: false, error: "Publique só depois de ter pelo menos um arquivo ou uma tabela aleatória." };
    }
  }

  const { error } = await supabase
    .from("suplementos")
    .update({
      publicado: publicar,
      // Data da primeira publicação fica; republicar não reordena o catálogo.
      publicado_em: publicar ? (atual.publicado_em ?? new Date().toISOString()) : atual.publicado_em,
    })
    .eq("id", id);

  if (error) {
    console.error("[alternarPublicacaoAction] erro:", error.message);
    return { ok: false, error: "Não deu pra mudar a publicação." };
  }

  revalidarSuplemento(atual.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Arquivos (R2)
// ---------------------------------------------------------------------

const prepararUploadSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  formato: z.enum(FORMATOS_ARQUIVO),
  tamanho: z.number().int().positive().max(TAMANHO_MAXIMO_ARQUIVO, "O arquivo passa de 100 MB."),
});

function chaveDoArquivo(suplementoId: string, nome: string, formato: FormatoArquivo) {
  const base = slugify(nome.replace(/\.[^.]+$/, "")) || "arquivo";
  return `suplementos/${suplementoId}/${Date.now()}-${base}.${formato}`;
}

export async function prepararUploadAction(
  suplementoId: string,
  input: unknown,
): Promise<Resultado<{ url: string; chave: string; contentType: string }>> {
  const parsed = prepararUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const { supabase } = await exigirAdmin();
  const { data: suplemento } = await supabase.from("suplementos").select("id").eq("id", suplementoId).maybeSingle();
  if (!suplemento) return { ok: false, error: "Suplemento não encontrado." };

  const chave = chaveDoArquivo(suplementoId, parsed.data.nome, parsed.data.formato);
  const contentType = MIME_POR_FORMATO[parsed.data.formato];

  try {
    const url = await urlUploadAssinada(chave, contentType);
    return { ok: true, url, chave, contentType };
  } catch (e) {
    console.error("[prepararUploadAction] erro:", e instanceof Error ? e.message : e);
    return { ok: false, error: "O armazenamento de arquivos não está disponível agora." };
  }
}

const registrarArquivoSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  chave: z.string().min(1),
  formato: z.enum(FORMATOS_ARQUIVO),
});

export async function registrarArquivoAction(suplementoId: string, input: unknown): Promise<Resultado> {
  const parsed = registrarArquivoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };
  const { nome, chave, formato } = parsed.data;

  // A chave vem do cliente: sem essa conferência, dava pra registrar num
  // suplemento um objeto que pertence a outro.
  if (!chave.startsWith(`suplementos/${suplementoId}/`)) {
    return { ok: false, error: "Arquivo não pertence a este suplemento." };
  }

  const { supabase } = await exigirAdmin();

  // Só registra depois de confirmar no R2 que o upload chegou de verdade — o
  // tamanho vem do R2, não do que o navegador disse.
  let tamanho: number | null;
  try {
    tamanho = await tamanhoDoObjeto(chave);
  } catch (e) {
    console.error("[registrarArquivoAction] erro no HEAD:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Não deu pra confirmar o upload no armazenamento." };
  }
  if (tamanho === null) return { ok: false, error: "O upload não chegou ao armazenamento. Tente de novo." };

  const { data: ultimos, error: ordemError } = await supabase
    .from("arquivos_suplemento")
    .select("ordem")
    .eq("suplemento_id", suplementoId)
    .order("ordem", { ascending: false })
    .limit(1);
  if (ordemError) return { ok: false, error: "Não deu pra registrar o arquivo." };

  const { data: suplemento } = await supabase.from("suplementos").select("slug").eq("id", suplementoId).single();

  const { error } = await supabase.from("arquivos_suplemento").insert({
    suplemento_id: suplementoId,
    nome,
    chave_r2: chave,
    formato,
    tamanho_bytes: tamanho,
    ordem: (ultimos?.[0]?.ordem ?? -1) + 1,
  });

  if (error) {
    console.error("[registrarArquivoAction] erro no insert:", error.message);
    // Objeto já está no R2 mas sem linha no banco: apaga pra não virar lixo.
    await apagarObjeto(chave).catch((e) => console.error("[registrarArquivoAction] limpeza falhou:", e));
    return { ok: false, error: "Não deu pra registrar o arquivo." };
  }

  revalidarSuplemento(suplemento?.slug);
  return { ok: true };
}

export async function removerArquivoAction(arquivoId: string): Promise<Resultado> {
  const { supabase } = await exigirAdmin();

  const { data: arquivo, error: leituraError } = await supabase
    .from("arquivos_suplemento")
    .select("chave_r2, suplementos(slug)")
    .eq("id", arquivoId)
    .is("removido_em", null)
    .maybeSingle();
  if (leituraError || !arquivo) return { ok: false, error: "Arquivo não encontrado." };

  // Marca primeiro: a partir daqui ninguém gera link novo pra ele, mesmo que
  // apagar no R2 falhe logo abaixo.
  const { error } = await supabase
    .from("arquivos_suplemento")
    .update({ removido_em: new Date().toISOString() })
    .eq("id", arquivoId);
  if (error) {
    console.error("[removerArquivoAction] erro:", error.message);
    return { ok: false, error: "Não deu pra remover o arquivo." };
  }

  try {
    await apagarObjeto(arquivo.chave_r2);
  } catch (e) {
    // Já está invisível pra todo mundo; objeto órfão no R2 é custo, não risco.
    console.error("[removerArquivoAction] objeto não apagado no R2:", arquivo.chave_r2, e);
  }

  const slug = (arquivo.suplementos as unknown as { slug: string } | null)?.slug;
  revalidarSuplemento(slug);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Tabelas aleatórias
// ---------------------------------------------------------------------

const itemSchema = z.object({
  faixaMin: z.number().int(),
  faixaMax: z.number().int(),
  valores: z.array(z.string().max(1000)),
  aninhada: z.string().nullable(),
});

const tabelaSchema = z.object({
  chave: z.string().min(1).max(64),
  titulo: z.string().trim().max(120),
  dado: z.enum(DADOS),
  colunas: z.array(z.string().trim().max(60)).max(8, "No máximo 8 colunas por tabela."),
  itens: z.array(itemSchema).max(100),
});

const tabelasSchema = z.array(tabelaSchema).max(20, "No máximo 20 tabelas por suplemento.");

export async function salvarTabelasAction(suplementoId: string, input: unknown): Promise<Resultado> {
  const parsed = tabelasSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };
  const tabelas: Tabela[] = parsed.data;

  // Mesma regra do editor, repetida no servidor: o cliente não é confiável.
  const erros = validarConjunto(tabelas);
  if (erros.length > 0) return { ok: false, error: erros.slice(0, 3).join(" ") };

  const { supabase } = await exigirAdmin();

  const { error } = await supabase.rpc("salvar_tabelas_suplemento", {
    p_suplemento_id: suplementoId,
    p_tabelas: tabelas.map((t, ordem) => ({
      chave: t.chave,
      titulo: t.titulo,
      dado: t.dado,
      colunas: t.colunas,
      ordem,
      itens: [...t.itens]
        .sort((a, b) => a.faixaMin - b.faixaMin)
        .map((i) => ({
          faixa_min: i.faixaMin,
          faixa_max: i.faixaMax,
          valores: i.valores,
          tabela_aninhada_chave: i.aninhada,
        })),
    })),
  });

  if (error) {
    console.error("[salvarTabelasAction] erro:", error.message);
    return { ok: false, error: "Não deu pra salvar as tabelas." };
  }

  const { data: suplemento } = await supabase.from("suplementos").select("slug").eq("id", suplementoId).single();
  revalidarSuplemento(suplemento?.slug);
  return { ok: true };
}
