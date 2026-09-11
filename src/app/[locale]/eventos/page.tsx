import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EventoCard, type EventoCardData } from "@/components/site/evento-card";

export const metadata: Metadata = {
  title: "Eventos — Quinto Dado",
  description: "Eventos presenciais de RPG de mesa organizados pelo Quinto Dado.",
  alternates: { canonical: "/eventos" },
};

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

export default async function EventosPage() {
  const eventos = await buscarEventos();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">Eventos</h1>
      <p className="mt-2 text-muted-foreground">
        Encontros presenciais de RPG de mesa organizados pelo Quinto Dado.
      </p>

      {eventos.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7DF3]/20 to-[#A855F7]/20 text-primary">
            <CalendarDays className="size-6" aria-hidden />
          </div>
          <p className="mt-4 font-heading text-lg font-bold">Nenhum evento aberto agora</p>
          <p className="mt-2 text-sm text-muted-foreground">Fica de olho, tem coisa vindo por aí.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <EventoCard key={evento.slug} evento={evento} />
          ))}
        </div>
      )}
    </div>
  );
}
