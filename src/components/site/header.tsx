import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import logo5d from "@/assets/brand/logo-5d.png";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { NotificationBell } from "./notification-bell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { buttonVariants } from "@/components/ui/button";

async function buscarSessao() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [{ data: perfil }, { count: naoLidas }] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, nome_exibicao, avatar_url, papel")
        .eq("id", user.id)
        .maybeSingle(),
      // Sem janela de tempo — ver buscarNotificacoesAction pro motivo:
      // não lida é não lida, não pode expirar sozinha.
      supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user.id)
        .is("lida_em", null),
    ]);

    if (!perfil) return null;

    return {
      perfil: {
        username: perfil.username as string,
        nomeExibicao: perfil.nome_exibicao as string,
        avatarUrl: perfil.avatar_url as string | null,
        papel: perfil.papel as string,
      },
      naoLidas: naoLidas ?? 0,
    };
  } catch {
    // Uma falha ao buscar sessão (ex.: instabilidade do Supabase) não pode
    // derrubar o site inteiro — cai pra visão de deslogado.
    return null;
  }
}

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const sessao = await buscarSessao();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      {/* Largura própria: segue a coluna do conteúdo (que tem a margem de 10vw),
          mas nunca fica abaixo de 60rem — senão logo, menu e conta não cabem
          numa linha só em telas largas, onde os 10vw comem muito espaço. */}
      <div className="mx-auto flex h-16 w-full max-w-[max(60rem,calc(min(64rem,100vw)_-_20vw))] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-lg font-bold tracking-tight"
        >
          <Image
            src={logo5d}
            alt=""
            priority
            className="h-8 w-8 rounded-md transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3"
          />
          <span className="text-marca">
            Quinto Dado
          </span>
        </Link>

        <DesktopNav />

        <div className="flex shrink-0 items-center gap-2">
          {sessao ? (
            <>
              <NotificationBell naoLidasIniciais={sessao.naoLidas} />
              <AccountMenu perfil={sessao.perfil} />
            </>
          ) : (
            <Link
              href="/entrar"
              className={buttonVariants({ variant: "marca", className: "h-9 px-4" })}
            >
              {t("entrar")}
            </Link>
          )}
          <MobileNav logado={Boolean(sessao)} />
        </div>
      </div>
    </header>
  );
}
