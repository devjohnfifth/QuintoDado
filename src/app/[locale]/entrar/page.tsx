import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import logo5d from "@/assets/brand/logo-5d.png";
import grupoJogandoRpg from "@/assets/brand/grupo-jogando-rpg.jpg";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EntrarForm } from "./entrar-form";
import { destinoSeguro } from "@/lib/auth/destino-seguro";

export const metadata: Metadata = {
  title: "Entrar — Quinto Dado",
  robots: { index: false },
};

export default async function EntrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ erro?: string; cadastro?: string; recuperacao?: string; next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Entrar");
  const sp = await searchParams;
  const destino = destinoSeguro(sp.next);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect({ href: destino, locale });
    }
  }

  const mensagemInicial =
    sp.cadastro === "confirme-email"
      ? t("mensagemConfirmeEmail")
      : sp.erro === "oauth"
        ? t("mensagemErroOauth")
        : sp.recuperacao === "enviada"
          ? "Se esse e-mail tiver conta, mandamos um link de recuperação. Confira sua caixa de entrada."
          : undefined;

  // Quem chega pelo botão de baixar/candidatar/comprar vê por que precisa entrar.
  const contexto = destino.startsWith("/suplementos/")
    ? t("contextoSuplemento")
    : destino.startsWith("/mesas/")
      ? t("contextoMesa")
      : destino.startsWith("/eventos/")
        ? t("contextoEvento")
        : t("subtitulo");
  const beneficios = [t("beneficio1"), t("beneficio2"), t("beneficio3")];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Coluna da esquerda: foto sangrando até a borda da tela. É o que
          tira a página do "formulário solto no meio do preto". */}
      <div className="textura-grao relative isolate flex items-center overflow-hidden px-4 py-14 sm:px-8 lg:px-12">
        <Image
          src={grupoJogandoRpg}
          alt=""
          fill
          priority
          placeholder="blur"
          className="-z-20 object-cover opacity-30"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/60 lg:bg-gradient-to-r lg:from-background/70 lg:via-background/80 lg:to-background"
        />

        <div className="mx-auto w-full max-w-md text-center lg:mx-0 lg:text-left">
          <Image src={logo5d} alt="" className="mx-auto size-12 rounded-xl lg:mx-0" priority />
          <h1 className="titulo-display titulo-secao mt-5">{t("titulo")}</h1>
          <p className="mt-3 text-lg text-foreground/80">{contexto}</p>
          <div className="mt-8 hidden lg:block">
            <p className="rotulo-caps text-muted-foreground">{t("beneficiosTitulo")}</p>
            <ul className="mt-4 space-y-3">
              {beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-foreground/85">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-acento" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Coluna da direita: o formulário, centralizado na altura toda. */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="painel-alto w-full max-w-sm rounded-2xl p-5 sm:p-6">
          <EntrarForm mensagemInicial={mensagemInicial} destino={destino} />
        </div>
      </div>
    </div>
  );
}
