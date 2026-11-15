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

      /*
       * Criar e editar mesa saiu de /presencial/* quando o mestre passou a
       * criar mesa online também — o formulário é o mesmo, só muda a
       * modalidade, e deixá-lo sob "presencial" ficaria mentiroso.
       *
       * /presencial/nova carrega ?modalidade=presencial pra que quem clicou
       * em "publique a sua" na página de presencial continue caindo no
       * formulário já marcado como presencial.
       *
       * Estas regras vêm DEPOIS das de presencial-bh de propósito: assim
       * /presencial-bh/nova resolve primeiro pra /presencial/nova e só então
       * chega aqui.
       */
      {
        source: "/presencial/nova",
        destination: "/mesas/nova?modalidade=presencial",
        permanent: true,
      },
      {
        source: "/:locale/presencial/nova",
        destination: "/:locale/mesas/nova?modalidade=presencial",
        permanent: true,
      },
      { source: "/presencial/:id/editar", destination: "/mesas/editar/:id", permanent: true },
      {
        source: "/:locale/presencial/:id/editar",
        destination: "/:locale/mesas/editar/:id",
        permanent: true,
      },

      /*
       * O painel de candidaturas do mestre saiu de /presencial/[id] porque
       * /presencial/[cidade] tomou o lugar: dois segmentos dinâmicos irmãos
       * não convivem no App Router, e o endereço por cidade é o que ranqueia.
       *
       * O padrão de UUID no source é o que separa um do outro — sem ele,
       * /presencial/belo-horizonte também cairia nesta regra.
       */
      {
        source: "/presencial/:id(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})",
        destination: "/mesas/candidaturas/:id",
        permanent: true,
      },
      {
        source: "/:locale/presencial/:id(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})",
        destination: "/:locale/mesas/candidaturas/:id",
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
