"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export function BannerUpload({
  value,
  onChange,
  bucket = "mesa-banners",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro("A imagem precisa ter até 5MB.");
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErro("Sua sessão expirou. Recarregue a página.");
      setEnviando(false);
      return;
    }

    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${user.id}/${Date.now()}.${extensao}`;

    const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setErro("Não deu pra enviar a imagem. Tente de novo.");
      setEnviando(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(caminho);
    onChange(publicUrlData.publicUrl);
    setEnviando(false);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-xl border border-border">
          <Image src={value} alt="" fill className="object-cover" sizes="320px" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Remover imagem"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          {enviando ? "Enviando..." : "Escolher imagem de capa"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={aoEscolherArquivo}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        JPEG, PNG ou WebP, até 5MB. A imagem é cortada pra preencher o card — prefira algo
        centralizado, sem texto importante nas bordas.
      </p>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
