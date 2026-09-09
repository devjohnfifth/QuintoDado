import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/conta",
        "/completar-cadastro",
        // Cobre /presencial-bh/nova, /presencial-bh/[id] (revisão de
        // candidaturas do mestre) e /presencial-bh/[id]/editar de uma vez —
        // tudo que não é a listagem pública em si.
        "/presencial-bh/*",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
