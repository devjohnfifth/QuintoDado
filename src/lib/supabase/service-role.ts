import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com service_role — ignora RLS. Regra invíolável #2 do CLAUDE.md:
 * só existe no servidor, e só deve ser usado onde a checagem de permissão
 * já foi feita explicitamente no código (ex.: handler de webhook de
 * pagamento, rotina de admin já validada por `eh_admin()`).
 *
 * Nunca importe este arquivo de um Client Component nem de um módulo que
 * possa acabar num bundle de cliente — o import "server-only" no topo
 * já falha o build se isso acontecer.
 */
export function serviceRole() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
