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
        // Telas de mestre logado: nada pra indexar. /mesas e /presencial em
        // si continuam liberadas — e /presencial/[cidade] PRECISA ser
        // rastreada, que é onde mora a busca por cidade.
        "/mesas/nova",
        "/mesas/editar/*",
        "/mesas/candidaturas/*",
        // Painel da mesa (elenco, sessões): área de quem já joga nela.
        "/mesas/*/painel",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
