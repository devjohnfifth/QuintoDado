import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CompletarCadastroForm } from "./completar-cadastro-form";

export const metadata: Metadata = {
  title: "Completar cadastro — Quinto Dado",
  robots: { index: false },
};

export default async function CompletarCadastroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CompletarCadastro");

  if (!isSupabaseConfigured()) {
    redirect({ href: "/entrar", locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil) {
    redirect({ href: "/", locale });
  }

  const nomeSugerido =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-heading text-2xl font-bold">{t("titulo")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitulo")}</p>
      <div className="mt-8">
        <CompletarCadastroForm nomeSugerido={nomeSugerido} />
      </div>
    </div>
  );
}
