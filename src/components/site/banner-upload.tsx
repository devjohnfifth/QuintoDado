"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, X, Loader2 } from "lucide-react";
import { enviarImagem } from "@/lib/storage/enviar-imagem";
import { Button } from "@/components/ui/button";

export function BannerUpload({
  value,
  onChange,
  bucket = "mesa-banners",
  hideHint = false,
  previewClassName = "aspect-[3/4] w-full max-w-[220px]",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  hideHint?: boolean;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);

    const resultado = await enviarImagem(arquivo, bucket);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    onChange(resultado.url);
    setEnviando(false);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className={`relative overflow-hidden rounded-xl border border-border ${previewClassName}`}>
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
      {!hideHint && (
        <p className="text-xs text-muted-foreground">
          JPEG, PNG ou WebP, até 5MB. A imagem é cortada pra preencher o card — prefira algo
          centralizado, sem texto importante nas bordas.
        </p>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
