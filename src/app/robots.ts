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
        "/presencial-bh/nova",
        "/presencial-bh/*/editar",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
