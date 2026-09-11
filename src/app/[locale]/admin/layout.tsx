import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const metadata = { robots: { index: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-[10vw]">
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Supabase ainda não está configurado neste ambiente (ver .env.example)
          — o admin não funciona até isso existir.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/entrar", locale });
    return null;
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.papel !== "admin") {
    redirect({ href: "/", locale });
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-[10vw]">
      <nav className="mb-8 flex gap-4 border-b border-border/60 pb-4 text-sm font-medium">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Painel
        </Link>
        <Link href="/admin/mesas" className="text-muted-foreground hover:text-foreground">
          Mesas
        </Link>
        <Link href="/admin/eventos" className="text-muted-foreground hover:text-foreground">
          Eventos
        </Link>
        <Link href="/admin/usuarios" className="text-muted-foreground hover:text-foreground">
          Usuários
        </Link>
      </nav>
      {children}
    </div>
  );
}
