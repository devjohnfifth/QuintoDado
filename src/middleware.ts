import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let avisouSupabaseAusente = false;

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request) ?? NextResponse.next();

  // Ainda não existe projeto Supabase (ver .env.example) — deixa o site
  // funcionar sem auth em vez de derrubar toda rota. Assim que as env vars
  // existirem, a sessão volta a ser mantida viva normalmente.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!avisouSupabaseAusente) {
      console.warn(
        "[middleware] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes — pulando refresh de sessão. Preencha .env.local (ver .env.example).",
      );
      avisouSupabaseAusente = true;
    }
    return response;
  }

  // Mantém a sessão do Supabase viva a cada navegação (necessário com
  // @supabase/ssr no App Router) sem atrapalhar o roteamento de locale acima.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
