import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Dices } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import { TIPO_MESA_LABEL, MODALIDADE_LABEL } from "@/lib/mesas/labels";
import { Reveal } from "@/components/site/reveal";

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

type Mesa = {
  id: string;
  slug: string;
  titulo: string;
  sinopse: string;
  modalidade: "online" | "presencial";
  cidade_uf: string | null;
  tipo: string;
  classificacao: string;
  preco_centavos: number;
  cobranca_gerenciada_pelo_site: boolean;
  data_inicio: string;
  vagas_total: number;
  sistemas: { nome: string } | null;
};

async function buscarMesas(): Promise<Mesa[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[/mesas] Supabase não configurado — mostrando estado vazio (ver .env.example).");
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "id, slug, titulo, sinopse, modalidade, cidade_uf, tipo, classificacao, preco_centavos, cobranca_gerenciada_pelo_site, data_inicio, vagas_total, sistemas(nome)",
    )
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/mesas] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as Mesa[];
}

export default async function MesasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Mesas");
  const mesas = await buscarMesas();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
          <Dices className="size-5" aria-hidden />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">{t("titulo")}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitulo")}</p>
      </Reveal>

      <Reveal className="mt-10">
        {mesas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-heading text-lg font-bold">{t("vazioTitulo")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("vazioCorpo")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {mesas.map((mesa) => (
              <li key={mesa.id}>
                <Link
                  href={`/mesas/${mesa.slug}`}
                  className="group flex h-full transform-gpu flex-col rounded-2xl border border-border bg-card/60 p-5 transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-primary/40"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {mesa.sistemas?.nome ?? "—"} · {TIPO_MESA_LABEL[mesa.tipo] ?? mesa.tipo}
                    {" · "}
                    {MODALIDADE_LABEL[mesa.modalidade] ?? mesa.modalidade}
                    {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` (${mesa.cidade_uf})` : ""}
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-bold">{mesa.titulo}</h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {mesa.sinopse}
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    {mesa.preco_centavos === 0
                      ? t("gratuita")
                      : formatBRL(mesa.preco_centavos)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
