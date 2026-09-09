"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Erro");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="font-heading text-2xl font-bold">{t("titulo")}</h1>
      <p className="mt-2 text-muted-foreground">{t("corpo")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
        >
          <RefreshCw className="size-4" aria-hidden />
          {t("tentarNovamente")}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("voltarHome")}
        </Link>
      </div>
    </div>
  );
}
