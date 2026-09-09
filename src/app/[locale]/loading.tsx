/**
 * Fallback genérico pra qualquer rota sem loading.tsx próprio — por
 * viver na raiz de [locale], esse arquivo vale pra toda a árvore
 * (só perde pra um loading.tsx mais específico, tipo /mesas ou
 * /mesas/[slug]). Por isso fica neutro, sem formato de nenhuma
 * página específica.
 */
export default function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        aria-hidden
        className="size-8 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
