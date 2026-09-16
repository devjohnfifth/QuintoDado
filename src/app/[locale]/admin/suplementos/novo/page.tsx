import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuplementoDadosForm } from "../suplemento-dados-form";

export default async function NovoSuplementoPage() {
  const supabase = await createClient();
  // "Outro" existe pra mesa descrever sistema fora do catálogo; suplemento
  // sem sistema específico usa "Genérico" (sistema_id nulo).
  const { data: sistemas } = await supabase
    .from("sistemas")
    .select("id, nome")
    .eq("ativo", true)
    .neq("slug", "outro")
    .order("nome");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/suplementos" className="hover:underline">
          ← Voltar pra suplementos
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold">Novo suplemento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Começa como rascunho. Arquivos e tabelas aleatórias entram na próxima tela.
      </p>
      <div className="mt-6">
        <SuplementoDadosForm sistemas={sistemas ?? []} />
      </div>
    </div>
  );
}
