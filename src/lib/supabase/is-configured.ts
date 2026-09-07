/**
 * Ainda não existe projeto Supabase real (ver .env.example). Páginas que
 * leem do banco checam isso primeiro e caem no mesmo estado vazio que um
 * visitante real veria — em vez de derrubar a rota, como o middleware fazia
 * antes de ser corrigido.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
