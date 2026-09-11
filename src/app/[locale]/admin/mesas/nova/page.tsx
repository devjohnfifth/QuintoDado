import { createClient } from "@/lib/supabase/server";
import { NovaMesaAdminForm } from "./nova-mesa-admin-form";

export default async function NovaMesaAdminPage() {
  const supabase = await createClient();
  const [{ data: sistemas }, { data: eventos }] = await Promise.all([
    supabase.from("sistemas").select("id, nome, slug").eq("ativo", true).order("nome"),
    supabase.from("eventos").select("id, titulo").in("status", ["rascunho", "publicado"]).order("data_inicio"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold">Nova mesa</h1>
      <NovaMesaAdminForm sistemas={sistemas ?? []} eventos={eventos ?? []} />
    </div>
  );
}
