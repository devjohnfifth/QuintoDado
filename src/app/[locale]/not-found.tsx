import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Dices } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function NaoEncontrado() {
  const t = await getTranslations("Erro");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Dices className="size-8" aria-hidden />
      </div>
      <p className="mt-4 font-heading text-5xl font-bold text-marca">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold">{t("naoEncontradoTitulo")}</h1>
      <p className="mt-2 text-muted-foreground">{t("naoEncontradoCorpo")}</p>
      <Link href="/" className={buttonVariants({ variant: "marca", size: "lg", className: "mt-8" })}>
        <ArrowLeft className="size-4" aria-hidden />
        {t("naoEncontradoCta")}
      </Link>
    </div>
  );
}
