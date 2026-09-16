"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
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
        <button onClick={reset} className={buttonVariants({ variant: "marca", size: "lg" })}>
          <RefreshCw className="size-4" aria-hidden />
          {t("tentarNovamente")}
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}>
          <ArrowLeft className="size-4" aria-hidden />
          {t("voltarHome")}
        </Link>
      </div>
    </div>
  );
}
