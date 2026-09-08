"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarCropDialog } from "./avatar-crop-dialog";
import { atualizarPerfilAction } from "@/app/[locale]/conta/actions";

type Sistema = { id: string; nome: string };

export function EditarPerfilForm({
  nomeExibicao,
  bio,
  avatarUrl,
  sistemasFavoritos,
  sistemas,
  onCancelar,
}: {
  nomeExibicao: string;
  bio: string | null;
  avatarUrl: string | null;
  sistemasFavoritos: string[];
  sistemas: Sistema[];
  onCancelar: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState(nomeExibicao);
  const [novoAvatar, setNovoAvatar] = useState<string | null>(avatarUrl);
  const [arquivoParaRecorte, setArquivoParaRecorte] = useState<File | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>(sistemasFavoritos);

  function alternarSistema(id: string) {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length >= 10 ? prev : [...prev, id],
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const resultado = await atualizarPerfilAction({
        nomeExibicao: nome,
        bio: formData.get("bio"),
        sistemasFavoritos: favoritos,
        avatarUrl: novoAvatar,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      router.refresh();
      onCancelar();
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-xl border border-border bg-card/40 p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative size-16 shrink-0 overflow-hidden rounded-full border border-border"
          >
            {novoAvatar ? (
              <Image src={novoAvatar} alt="" fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-lg font-semibold text-white">
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setArquivoParaRecorte(f);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Clique na foto pra trocar. JPEG, PNG ou WebP.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeExibicao">Nome de exibição</Label>
          <Input
            id="nomeExibicao"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" defaultValue={bio ?? ""} maxLength={280} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Sistemas favoritos</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sistemas.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
              >
                <Checkbox
                  checked={favoritos.includes(s.id)}
                  onCheckedChange={() => alternarSistema(s.id)}
                />
                {s.nome}
              </label>
            ))}
          </div>
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar perfil"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      </form>

      <AvatarCropDialog
        arquivo={arquivoParaRecorte}
        onFechar={() => setArquivoParaRecorte(null)}
        onSalvo={(url) => {
          setNovoAvatar(url);
          setArquivoParaRecorte(null);
        }}
      />
    </>
  );
}
