import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TODO(fase 1): apontar para o bucket real do Cloudflare R2 quando existir.
    ],
  },
};

export default withNextIntl(nextConfig);
