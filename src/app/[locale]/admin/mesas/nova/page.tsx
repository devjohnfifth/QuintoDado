import { createClient } from "@/lib/supabase/server";
import { NovaMesaAdminForm, type EventoOpcao } from "./nova-mesa-admin-form";

export default async function NovaMesaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ eventoId?: string }>;
}) {
  const { eventoId } = await searchParams;
  const supabase = await createClient();

  const [{ data: sistemas }, { data: evento }] = await Promise.all([
    supabase.from("sistemas").select("id, nome, slug").eq("ativo", true).order("nome"),
    eventoId
      ? supabase
          .from("eventos")
          .select("id, titulo, cidade_uf, data_inicio, data_fim")
          .eq("id", eventoId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const eventoVinculado: EventoOpcao | null = evento
    ? {
        id: evento.id,
        titulo: evento.titulo,
        cidadeUf: evento.cidade_uf,
        dataInicio: evento.data_inicio,
        dataFim: evento.data_fim,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold">Nova mesa</h1>
      <NovaMesaAdminForm sistemas={sistemas ?? []} eventoVinculado={eventoVinculado} />
    </div>
  );
}
