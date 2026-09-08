"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PREVIEW = 280;
const SAIDA = 512;

export function AvatarCropDialog({
  arquivo,
  onFechar,
  onSalvo,
}: {
  arquivo: File | null;
  onFechar: () => void;
  onSalvo: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const arrastoRef = useRef<{ x: number; y: number } | null>(null);

  const [escala, setEscala] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!arquivo) return;
    setEscala(1);
    setOffset({ x: 0, y: 0 });
    setErro(null);

    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      desenhar(1, { x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo]);

  function dimensaoBase(img: HTMLImageElement, tamanho: number) {
    const razao = Math.max(tamanho / img.naturalWidth, tamanho / img.naturalHeight);
    return { w: img.naturalWidth * razao, h: img.naturalHeight * razao };
  }

  function desenhar(escalaAtual: number, offsetAtual: { x: number; y: number }, tamanho = PREVIEW) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = tamanho;
    canvas.height = tamanho;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fator = tamanho / PREVIEW;
    const { w, h } = dimensaoBase(img, tamanho);

    ctx.clearRect(0, 0, tamanho, tamanho);
    ctx.save();
    ctx.translate(tamanho / 2 + offsetAtual.x * fator, tamanho / 2 + offsetAtual.y * fator);
    ctx.scale(escalaAtual, escalaAtual);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  useEffect(() => {
    desenhar(escala, offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escala, offset]);

  function aoIniciarArrasto(e: React.PointerEvent) {
    arrastoRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function aoArrastar(e: React.PointerEvent) {
    if (!arrastoRef.current) return;
    setOffset({ x: e.clientX - arrastoRef.current.x, y: e.clientY - arrastoRef.current.y });
  }

  function aoSoltarArrasto() {
    arrastoRef.current = null;
  }

  async function salvar() {
    const img = imgRef.current;
    if (!img) return;
    setEnviando(true);
    setErro(null);

    const canvasSaida = document.createElement("canvas");
    canvasSaida.width = SAIDA;
    canvasSaida.height = SAIDA;
    const ctx = canvasSaida.getContext("2d");
    if (!ctx) {
      setEnviando(false);
      return;
    }
    const fator = SAIDA / PREVIEW;
    const { w, h } = dimensaoBase(img, SAIDA);
    ctx.translate(SAIDA / 2 + offset.x * fator, SAIDA / 2 + offset.y * fator);
    ctx.scale(escala, escala);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvasSaida.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setErro("Não deu pra processar a imagem.");
      setEnviando(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErro("Sua sessão expirou. Recarregue a página.");
      setEnviando(false);
      return;
    }

    const caminho = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(caminho, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });

    if (error) {
      setErro("Não deu pra enviar a foto. Tente de novo.");
      setEnviando(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(caminho);
    setEnviando(false);
    onSalvo(publicUrlData.publicUrl);
  }

  return (
    <Dialog open={Boolean(arquivo)} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar foto de perfil</DialogTitle>
          <DialogDescription>Arraste pra reposicionar e use o zoom pra ajustar o enquadramento.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div className="relative size-[280px] overflow-hidden rounded-full border border-border bg-black/40">
            <canvas
              ref={canvasRef}
              width={PREVIEW}
              height={PREVIEW}
              className="size-full touch-none"
              onPointerDown={aoIniciarArrasto}
              onPointerMove={aoArrastar}
              onPointerUp={aoSoltarArrasto}
              onPointerLeave={aoSoltarArrasto}
            />
          </div>
        </div>

        <div className="px-1">
          <Slider
            value={[escala]}
            onValueChange={(v) => setEscala(Array.isArray(v) ? v[0] : v)}
            min={1}
            max={3}
            step={0.01}
          />
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" onClick={salvar} disabled={enviando}>
            {enviando ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
