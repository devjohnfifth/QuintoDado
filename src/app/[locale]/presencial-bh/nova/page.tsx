import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { NovaMesaForm } from "./nova-mesa-form";
import { SolicitarMestreButton } from "./solicitar-mestre-button";

export const metadata: Metadata = {
  title: "Criar mesa presencial em BH — Quinto Dado",
  robots: { index: false },
};

export default async function NovaMesaPresencialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PresencialBhNova");

  const conteudo = await resolverAcesso();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-[10vw]">
      <h1 className="font-heading text-3xl font-bold">{t("titulo")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitulo")}</p>
      {conteudo}
    </div>
  );

  async function resolverAcesso() {
    if (!isSupabaseConfigured()) {
      return (
        <Aviso>
          Supabase ainda não está configurado neste ambiente (ver
          .env.example) — não dá pra criar mesas até isso existir.
        </Aviso>
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return (
        <Aviso>
          {t("precisaEntrar")}{" "}
          <Link href="/entrar" className="text-primary hover:underline">
            Entrar
          </Link>
        </Aviso>
      );
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("papel, mestre_solicitado_em")
      .eq("id", user.id)
      .single();

    if (!perfil || !["mestre", "admin"].includes(perfil.papel)) {
      return (
        <Aviso>
          {t("precisaSerMestre")}{" "}
          <Link href="/links" className="text-primary hover:underline">
            Falar com a comunidade
          </Link>
          <SolicitarMestreButton jaSolicitado={Boolean(perfil?.mestre_solicitado_em)} />
        </Aviso>
      );
    }

    const { data: sistemas } = await supabase
      .from("sistemas")
      .select("id, nome, slug")
      .eq("ativo", true)
      .order("nome");

    return <NovaMesaForm sistemas={sistemas ?? []} />;
  }
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
