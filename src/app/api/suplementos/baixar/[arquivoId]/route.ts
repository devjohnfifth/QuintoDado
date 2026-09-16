import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2Configurado, urlDownloadAssinada } from "@/lib/storage/r2";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Download exige login. O RLS decide se o arquivo é legível (publicado,
 * gratuito, idade) tanto no select quanto no insert em `downloads`, então
 * esta rota não repete a regra. O link assinado vale só 15 min e é gerado a
 * cada clique.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ arquivoId: string }> }) {
  const { arquivoId } = await params;
  if (!UUID.test(arquivoId)) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: arquivo, error } = await supabase
    .from("arquivos_suplemento")
    .select("id, nome, chave_r2, suplementos(slug)")
    .eq("id", arquivoId)
    .is("removido_em", null)
    .maybeSingle();

  if (error) console.error("[baixar] erro ao buscar arquivo:", error.message);
  if (!arquivo) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const slug = (arquivo.suplementos as unknown as { slug: string } | null)?.slug;
  if (!user) {
    const entrar = new URL("/entrar", request.url);
    entrar.searchParams.set("next", slug ? `/suplementos/${slug}` : "/suplementos");
    return NextResponse.redirect(entrar, 303);
  }

  if (!r2Configurado()) {
    console.error("[baixar] R2 não configurado neste ambiente.");
    return new NextResponse("Download indisponível no momento.", { status: 503 });
  }

  const { error: dlError } = await supabase.from("downloads").insert({ usuario_id: user.id, arquivo_id: arquivo.id });
  if (dlError) {
    console.error("[baixar] erro ao registrar download:", dlError.message);
    return new NextResponse("Não deu pra liberar esse download.", { status: 403 });
  }

  const url = await urlDownloadAssinada(arquivo.chave_r2, arquivo.nome);
  return NextResponse.redirect(url, 303);
}
