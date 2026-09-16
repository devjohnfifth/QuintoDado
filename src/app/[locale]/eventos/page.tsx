import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EventoCard, type EventoCardData } from "@/components/site/evento-card";
import { Container } from "@/components/site/container";
import { PageHeader } from "@/components/site/page-header";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Eventos" });
  const title = t("metaTitulo");
  const description = t("metaDescricao");
  return {
    title,
    description,
    alternates: { canonical: "/eventos" },
    openGraph: { title, description, locale, type: "website" },
  };
}

async function buscarEventos(): Promise<EventoCardData[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("slug, titulo, subtitulo, cidade_uf, data_inicio, banner_url, evento_ingresso_tipos(preco_centavos)")
    .eq("status", "publicado")
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/eventos] erro ao buscar eventos:", error.message);
    return [];
  }

  return (data ?? []) as unknown as EventoCardData[];
}

export default async function EventosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Eventos");
  const eventos = await buscarEventos();

  return (
    <Container className="py-16">
      <PageHeader icone={CalendarDays} titulo={t("titulo")} subtitulo={t("subtitulo")} />

      <div className="mt-8">
        {eventos.length === 0 ? (
          <EstadoVazio icone={CalendarDays} titulo={t("vazioTitulo")} corpo={t("vazioCorpo")} />
        ) : (
          <GradeAdaptavel
            itens={eventos}
            chave={(e) => e.slug}
            render={(evento, destaque) => <EventoCard evento={evento} destaque={destaque} />}
          />
        )}
      </div>
    </Container>
  );
}
