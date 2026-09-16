import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import pracaSete from "@/assets/presencial-bh/praca-sete.webp";
import { Container } from "@/components/site/container";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { buttonVariants } from "@/components/ui/button";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";

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
    alternates: { canonical: "/presencial-bh" },
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      images: [{ url: pracaSete.src, width: pracaSete.width, height: pracaSete.height }],
    },
  };
}

async function buscarMesasPresenciaisBh(): Promise<MesaCardData[]> {
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
      "slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo)",
    )
    .eq("modalidade", "presencial")
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .ilike("cidade_uf", "%belo horizonte%")
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/presencial-bh] erro ao buscar mesas:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MesaCardData[];
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
          <Link href="/presencial-bh/nova" className={buttonVariants({ variant: "marca", size: "lg", className: "mt-8" })}>
            {t("criarMesa")}
          </Link>
        </div>
      </section>

      <Container className="pb-20">
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t("comoFunciona")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("comoFuncionaCorpo")}</p>
        </div>

        <div className="mt-8">
          {mesas.length === 0 ? (
            <EstadoVazio icone={MapPin} titulo={t("vazioTitulo")} corpo={t("vazioCorpo")} />
          ) : (
            <GradeAdaptavel
              itens={mesas}
              chave={(m) => m.slug}
              render={(mesa, destaque) => <MesaCard mesa={mesa} destaque={destaque} />}
            />
          )}
        </div>
      </Container>
    </>
  );
}
