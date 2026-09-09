import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const ROTAS_ESTATICAS = [
  "",
  "/mesas",
  "/presencial-bh",
  "/sobre",
  "/links",
  "/suplementos",
  "/entrar",
  "/termos",
  "/privacidade",
  "/reembolso",
  "/licenca-de-uso",
];

async function buscarSlugsDeMesas() {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("mesas")
    .select("slug, criado_em")
    .in("status", ["publicada", "confirmada", "em_andamento"]);

  return data ?? [];
}

const PRIORIDADE: Record<string, number> = {
  "": 1,
  "/mesas": 0.9,
  "/presencial-bh": 0.8,
  "/sobre": 0.7,
  "/links": 0.6,
  "/suplementos": 0.6,
  "/entrar": 0.3,
  "/termos": 0.2,
  "/privacidade": 0.2,
  "/reembolso": 0.2,
  "/licenca-de-uso": 0.2,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mesas = await buscarSlugsDeMesas();

  return [
    ...ROTAS_ESTATICAS.map((rota) => ({
      url: `${site}${rota}`,
      lastModified: new Date(),
      changeFrequency: (rota === "" || rota === "/mesas" ? "daily" : "weekly") as "daily" | "weekly",
      priority: PRIORIDADE[rota] ?? 0.5,
    })),
    ...mesas.map((mesa) => ({
      url: `${site}/mesas/${mesa.slug}`,
      lastModified: new Date(mesa.criado_em as string),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
