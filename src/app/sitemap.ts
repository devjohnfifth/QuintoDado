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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mesas = await buscarSlugsDeMesas();

  return [
    ...ROTAS_ESTATICAS.map((rota) => ({
      url: `${site}${rota}`,
      lastModified: new Date(),
    })),
    ...mesas.map((mesa) => ({
      url: `${site}/mesas/${mesa.slug}`,
      lastModified: new Date(mesa.criado_em as string),
    })),
  ];
}
