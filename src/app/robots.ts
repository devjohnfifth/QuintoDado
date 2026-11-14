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
        // Cobre /presencial/[id] (revisão de candidaturas do mestre) sem
        // tocar na listagem pública em si.
        "/presencial/*",
        // Criar e editar mesa saíram pra cá. São telas de mestre logado:
        // nada pra indexar, e /mesas em si continua liberada.
        "/mesas/nova",
        "/mesas/editar/*",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
