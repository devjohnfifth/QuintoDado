import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CIDADES_PRESENCIAIS, SLUG_CIDADE } from "@/lib/mesas/cidades";

const ROTAS_ESTATICAS = [
  "",
  "/mesas",
  "/eventos",
  "/presencial",
  "/sobre",
  "/links",
  "/suplementos",
  "/termos",
  "/privacidade",
  "/reembolso",
  "/licenca-de-uso",
];

/** As páginas de cidade: uma por cidade atendida, sempre — mesmo sem mesa
 * publicada nela, porque a página explica como funciona e leva ao moderador
 * da região. É o que responde a busca por "RPG presencial em <cidade>". */
const ROTAS_CIDADE = CIDADES_PRESENCIAIS.map((c) => `/presencial/${SLUG_CIDADE[c]}`);

async function buscarSlugsDeSuplementos() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  // `publicado` é o mesmo filtro da listagem pública; a RLS ainda corta por
  // faixa etária, então o sitemap nunca anuncia o que o visitante não veria.
  const { data, error } = await supabase
    .from("suplementos")
    .select("slug, publicado_em")
    .eq("publicado", true);

  if (error) {
    console.error("[sitemap] erro ao buscar suplementos:", error.message);
  }

  return data ?? [];
}

async function buscarSlugsDeMesas() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("slug, atualizado_em")
    .in("status", ["publicada", "confirmada", "em_andamento"]);

  if (error) {
    console.error("[sitemap] erro ao buscar mesas:", error.message);
  }

  return data ?? [];
}

async function buscarSlugsDeEventos() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("slug, atualizado_em")
    // Encerrado também: a página continua no ar desde a migration
    // 20261115230000, e é conteúdo real que o Google já conhecia.
    .in("status", ["publicado", "encerrado"]);

  if (error) {
    console.error("[sitemap] erro ao buscar eventos:", error.message);
  }

  return data ?? [];
}

const PRIORIDADE: Record<string, number> = {
  "": 1,
  "/mesas": 0.9,
  "/eventos": 0.8,
  "/presencial": 0.8,
  // Cada cidade vale tanto quanto a página geral: é por ela que a busca local
  // chega.
  ...Object.fromEntries(CIDADES_PRESENCIAIS.map((c) => [`/presencial/${SLUG_CIDADE[c]}`, 0.8])),
  "/sobre": 0.7,
  "/links": 0.6,
  "/suplementos": 0.6,
  "/termos": 0.2,
  "/privacidade": 0.2,
  "/reembolso": 0.2,
  "/licenca-de-uso": 0.2,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [mesas, eventos, suplementos] = await Promise.all([
    buscarSlugsDeMesas(),
    buscarSlugsDeEventos(),
    buscarSlugsDeSuplementos(),
  ]);

  return [
    ...[...ROTAS_ESTATICAS, ...ROTAS_CIDADE].map((rota) => ({
      url: `${site}${rota}`,
      lastModified: new Date(),
      changeFrequency: (rota === "" || rota === "/mesas" ? "daily" : "weekly") as "daily" | "weekly",
      priority: PRIORIDADE[rota] ?? 0.5,
    })),
    ...mesas.map((mesa) => ({
      url: `${site}/mesas/${mesa.slug}`,
      lastModified: new Date(mesa.atualizado_em as string),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...eventos.map((evento) => ({
      url: `${site}/eventos/${evento.slug}`,
      lastModified: new Date(evento.atualizado_em as string),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Os suplementos estavam fora do sitemap — e são as páginas que mais
    // puxam busca de cauda longa ("tabela de encontros no esgoto", "nomes
    // medievais irlandeses"). Mudam pouco depois de publicadas.
    ...suplementos.map((s) => ({
      url: `${site}/suplementos/${s.slug}`,
      lastModified: s.publicado_em ? new Date(s.publicado_em as string) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
