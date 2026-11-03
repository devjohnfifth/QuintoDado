import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Storage do Supabase (capas de mesa, avatares) — trocar/complementar
      // com o bucket do Cloudflare R2 quando ele existir de verdade.
      { protocol: "https", hostname: "jqtkjovvrjdpzpbrqyeg.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  /*
   * /presencial-bh virou /presencial quando o site deixou de atender só Belo
   * Horizonte. O endereço antigo está indexado e já circulou (link-in-bio,
   * Instagram), então vira redirect permanente em vez de 404 — leva o SEO
   * junto e não quebra link de ninguém.
   *
   * `:caminho*` cobre as rotas filhas (/nova, /[id], /[id]/editar) e a
   * segunda regra cobre o prefixo de locale (/en/presencial-bh), que existe
   * porque o pt-BR vai sem prefixo e o inglês está reservado.
   */
  async redirects() {
    return [
      { source: "/presencial-bh", destination: "/presencial", permanent: true },
      { source: "/presencial-bh/:caminho*", destination: "/presencial/:caminho*", permanent: true },
      { source: "/:locale/presencial-bh", destination: "/:locale/presencial", permanent: true },
      {
        source: "/:locale/presencial-bh/:caminho*",
        destination: "/:locale/presencial/:caminho*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
