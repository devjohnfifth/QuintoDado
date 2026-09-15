import { createClient } from "@/lib/supabase/client";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export type ResultadoUpload = { ok: true; url: string } | { ok: false; erro: string };

/**
 * Valida e envia uma imagem pro Storage, devolvendo a URL pública.
 *
 * O caminho começa com o id do usuário porque as policies dos buckets de
 * imagem (`mesa-banners`, `event-banners`) só deixam escrever dentro do
 * próprio diretório — ver `20260908140000_storage_mesa_banners.sql`.
 */
export async function enviarImagem(arquivo: File, bucket: string): Promise<ResultadoUpload> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { ok: false, erro: "Use uma imagem JPEG, PNG ou WebP." };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { ok: false, erro: "A imagem precisa ter até 5MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, erro: "Sua sessão expirou. Recarregue a página." };
  }

  const extensao = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${user.id}/${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("[enviarImagem] erro no upload:", error.message);
    return { ok: false, erro: "Não deu pra enviar a imagem. Tente de novo." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
  return { ok: true, url: data.publicUrl };
}
