/**
 * Placeholder até existir um projeto Supabase real (ou Docker local) para
 * gerar os tipos de verdade a partir do schema aplicado. Regenerar com:
 *
 *   pnpm dlx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *   # ou, com Docker + `supabase start` rodando localmente:
 *   pnpm dlx supabase gen types typescript --local > src/lib/supabase/types.ts
 *
 * O schema fonte da verdade enquanto isso é `supabase/migrations/*.sql`
 * (mesmo conteúdo de docs/Modelo-de-Dados_QuintoDado_v1.sql).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
