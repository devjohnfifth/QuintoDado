import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import logo5d from "@/assets/brand/logo-5d.png";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EntrarForm } from "./entrar-form";
import { destinoSeguro } from "@/lib/auth/destino-seguro";

export const metadata: Metadata = {
  title: "Entrar — Quinto Dado",
  robots: { index: false },
};

export default async function EntrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ erro?: string; cadastro?: string; recuperacao?: string; next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Entrar");
  const sp = await searchParams;
  const destino = destinoSeguro(sp.next);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect({ href: destino, locale });
    }
  }

  const mensagemInicial =
    sp.cadastro === "confirme-email"
      ? t("mensagemConfirmeEmail")
      : sp.erro === "oauth"
        ? t("mensagemErroOauth")
        : sp.recuperacao === "enviada"
          ? "Se esse e-mail tiver conta, mandamos um link de recuperação. Confira sua caixa de entrada."
          : undefined;

  // Quem chega pelo botão de baixar/candidatar/comprar vê por que precisa entrar.
  const contexto = destino.startsWith("/suplementos/")
    ? t("contextoSuplemento")
    : destino.startsWith("/mesas/")
      ? t("contextoMesa")
      : destino.startsWith("/eventos/")
        ? t("contextoEvento")
        : t("subtitulo");
  const beneficios = [t("beneficio1"), t("beneficio2"), t("beneficio3")];

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-[10vw]">
      <div className="text-center lg:text-left">
        <Image src={logo5d} alt="" className="mx-auto size-12 rounded-xl lg:mx-0" priority />
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-2 text-muted-foreground">{contexto}</p>
        <div className="mt-8 hidden lg:block">
          <p className="text-sm font-medium">{t("beneficiosTitulo")}</p>
          <ul className="mt-3 space-y-2.5">
            {beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card/60 p-5 sm:p-6 lg:max-w-none">
        <EntrarForm mensagemInicial={mensagemInicial} destino={destino} />
      </div>
    </div>
  );
}
