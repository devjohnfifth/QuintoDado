import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Confere que quem chama é admin e devolve o client já autenticado.
 *
 * É a checagem de mensagem clara; a garantia de verdade é o RLS (`eh_admin()`
 * nas policies). Existem cópias locais antigas desta função em
 * `admin/mesas`, `admin/eventos` e `admin/usuarios` — código novo usa esta.
 */
export async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase, adminId: user.id };
}
