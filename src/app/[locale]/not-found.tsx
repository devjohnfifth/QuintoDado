import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, BookOpen, Dices } from "lucide-react";
import { Container } from "@/components/site/container";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import { buttonVariants } from "@/components/ui/button";

export default async function NaoEncontrado() {
  const t = await getTranslations("Erro");

  return (
    <section className="textura-grao relative isolate flex min-h-[70vh] items-center overflow-hidden">
      {/* "Rolou 1": a página de erro é o único lugar onde dá pra brincar com
          o dado sem atrapalhar ninguém. */}
      <D20MarcaDagua className="pointer-events-none absolute -right-20 top-0 -z-10 size-[26rem] text-foreground/[0.04]" />
      <D20MarcaDagua className="pointer-events-none absolute -left-24 bottom-0 -z-10 size-80 text-foreground/[0.03]" />

      <Container className="py-20 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-erro/40 bg-erro/10">
          <span className="titulo-display text-3xl text-erro">1</span>
        </div>
        <p className="rotulo-caps mt-6 text-muted-foreground">{t("naoEncontradoRolou")}</p>
        <p className="titulo-display titulo-hero text-marca">404</p>
        <h1 className="titulo-display titulo-secao mt-2">{t("naoEncontradoTitulo")}</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-foreground/80">{t("naoEncontradoCorpo")}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "marca", size: "lg" })}>
            <ArrowLeft className="size-4" aria-hidden />
            {t("naoEncontradoCta")}
          </Link>
          <Link href="/mesas" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}>
            <Dices className="size-4" aria-hidden />
            {t("naoEncontradoMesas")}
          </Link>
          <Link
            href="/suplementos"
            className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}
          >
            <BookOpen className="size-4" aria-hidden />
            {t("naoEncontradoSuplementos")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
