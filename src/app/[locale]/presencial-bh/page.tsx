import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatBRL } from "@/lib/format";
import pracaSete from "@/assets/presencial-bh/praca-sete.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "RPG de mesa presencial em Belo Horizonte — Quinto Dado";
  const description =
    "Mesas presenciais de RPG em BH, criadas por mestres cadastrados no Quinto Dado. Grátis ou com valor combinado pra handouts.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: pracaSete.src, width: pracaSete.width, height: pracaSete.height }],
    },
  };
}

type MesaPresencial = {
  id: string;
  slug: string;
  titulo: string;
  sinopse: string;
  banner_url: string | null;
  cidade_uf: string | null;
  data_inicio: string;
  vagas_total: number;
  preco_centavos: number;
  sistemas: { nome: string } | null;
};

async function buscarMesasPresenciaisBh(): Promise<MesaPresencial[]> {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[/presencial-bh] Supabase não configurado — mostrando estado vazio (ver .env.example).",
    );
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "id, slug, titulo, sinopse, banner_url, cidade_uf, data_inicio, vagas_total, preco_centavos, sistemas(nome)",
    )
    .eq("modalidade", "presencial")
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .ilike("cidade_uf", "%belo horizonte%")
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/presencial-bh] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaPresencial[];
}

export default async function PresencialBhPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PresencialBh");
  const mesas = await buscarMesasPresenciaisBh();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={pracaSete}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {t("titulo")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("subtitulo")}
          </p>
          <Link
            href="/presencial-bh/nova"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("criarMesa")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t("comoFunciona")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("comoFuncionaCorpo")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        {mesas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-heading text-lg font-bold">{t("vazioTitulo")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("vazioCorpo")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {mesas.map((mesa) => (
              <li
                key={mesa.id}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {mesa.sistemas?.nome ?? "—"} · {mesa.cidade_uf}
                </p>
                <h3 className="mt-1 font-heading text-lg font-bold">{mesa.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {mesa.sinopse}
                </p>
                <p className="mt-3 text-sm font-medium">
                  {mesa.preco_centavos === 0
                    ? t("gratuita")
                    : `${t("valorHandouts")}: ${formatBRL(mesa.preco_centavos)}`}
                </p>
                <Link
                  href={`/mesas/${mesa.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  {t("verMesa")} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
