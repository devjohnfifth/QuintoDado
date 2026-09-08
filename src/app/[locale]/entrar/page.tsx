import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EntrarForm } from "./entrar-form";

export const metadata: Metadata = {
  title: "Entrar — Quinto Dado",
  robots: { index: false },
};

export default async function EntrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ erro?: string; cadastro?: string; recuperacao?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Entrar");
  const sp = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect({ href: "/", locale });
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

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center font-heading text-2xl font-bold">{t("titulo")}</h1>
      <EntrarForm mensagemInicial={mensagemInicial} />
    </div>
  );
}
