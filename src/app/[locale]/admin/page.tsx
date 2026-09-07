import { Link } from "@/i18n/navigation";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Painel</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/mesas"
          className="rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
        >
          <p className="font-heading font-bold">Mesas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Criar mesas, aprovar mesas presenciais enviadas por mestres.
          </p>
        </Link>
      </div>
    </div>
  );
}
