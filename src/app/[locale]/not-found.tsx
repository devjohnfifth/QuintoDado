import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default async function NaoEncontrado() {
  const t = await getTranslations("Erro");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="font-heading text-2xl font-bold">{t("naoEncontradoTitulo")}</h1>
      <p className="mt-2 text-muted-foreground">{t("naoEncontradoCorpo")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("naoEncontradoCta")}
      </Link>
    </div>
  );
}
