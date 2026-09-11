import { createClient } from "@/lib/supabase/server";
import { NovaMesaAdminForm } from "./nova-mesa-admin-form";

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
      ? supabase.from("eventos").select("id, titulo").eq("id", eventoId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold">Nova mesa</h1>
      <NovaMesaAdminForm sistemas={sistemas ?? []} eventoVinculado={evento ?? null} />
    </div>
  );
}
