import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import logo5d from "@/assets/brand/logo-5d.png";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

async function buscarPerfilLogado() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("username, nome_exibicao, avatar_url, papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) return null;

  return {
    username: perfil.username as string,
    nomeExibicao: perfil.nome_exibicao as string,
    avatarUrl: perfil.avatar_url as string | null,
    papel: perfil.papel as string,
  };
}

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const perfil = await buscarPerfilLogado();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[57.6rem] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
        >
          <Image
            src={logo5d}
            alt=""
            priority
            className="h-8 w-8 rounded-md transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3"
          />
          <span className="bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] bg-clip-text text-transparent">
            Quinto Dado
          </span>
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2">
          {perfil ? (
            <AccountMenu perfil={perfil} />
          ) : (
            <Link
              href="/entrar"
              className="rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] px-4 py-2 text-sm font-medium text-white shadow-[0_0_0_0_rgba(79,125,243,0)] transition-all duration-200 hover:shadow-[0_0_20px_-2px_rgba(139,92,246,0.6)]"
            >
              {t("entrar")}
            </Link>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
