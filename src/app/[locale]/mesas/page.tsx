import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Dices } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Reveal } from "@/components/site/reveal";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Mesas de RPG abertas — Quinto Dado";
  const description =
    "One-shots online e mesas presenciais com o Quinto Dado. Vagas limitadas, linhas e véus combinados antes de começar.";
  return { title, description, openGraph: { title, description, locale, type: "website" } };
}

async function buscarMesas(): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[/mesas] Supabase não configurado — mostrando estado vazio (ver .env.example).");
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados",
    )
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/mesas] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaCardData[];
}

async function ehAdmin() {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  return perfil?.papel === "admin";
}

export default async function MesasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Mesas");
  const [mesas, admin] = await Promise.all([buscarMesas(), ehAdmin()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
              <Dices className="size-5" aria-hidden />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">{t("titulo")}</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitulo")}</p>
          </div>
          {admin && (
            <Link
              href="/admin/mesas/nova"
              className="shrink-0 rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white"
            >
              + Nova mesa
            </Link>
          )}
        </div>
      </Reveal>

      <Reveal className="mt-10">
        {mesas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-heading text-lg font-bold">{t("vazioTitulo")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("vazioCorpo")}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {mesas.map((mesa) => (
              <li key={mesa.slug}>
                <MesaCard mesa={mesa} />
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
