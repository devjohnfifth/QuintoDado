import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta do redirect OAuth (Google). Depois de trocar o code pela
 * sessão, checa se o profile já existe — login social não passa pelo
 * trigger que cria o profile (falta data_nascimento), então manda pra
 * /completar-cadastro quando ainda não existir.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!perfil) {
    return NextResponse.redirect(`${origin}/completar-cadastro`);
  }

  return NextResponse.redirect(origin);
}
