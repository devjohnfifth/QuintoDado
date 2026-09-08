import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Storage do Supabase (capas de mesa, avatares) — trocar/complementar
      // com o bucket do Cloudflare R2 quando ele existir de verdade.
      { protocol: "https", hostname: "jqtkjovvrjdpzpbrqyeg.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
