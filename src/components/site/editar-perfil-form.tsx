"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { iniciais } from "@/lib/perfil/iniciais";
import { AvatarCropDialog } from "./avatar-crop-dialog";
import { atualizarPerfilAction } from "@/app/[locale]/conta/actions";

type Sistema = { id: string; nome: string };

export function EditarPerfilForm({
  nomeExibicao,
  nomeCompleto,
  telefone,
  bio,
  avatarUrl,
  perfilPublico,
  sistemasFavoritos,
  sistemas,
  onCancelar,
}: {
  nomeExibicao: string;
  nomeCompleto: string | null;
  telefone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  perfilPublico: boolean;
  sistemasFavoritos: string[];
  sistemas: Sistema[];
  onCancelar: () => void;
}) {
  const t = useTranslations("Conta");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState(nomeExibicao);
  const [novoAvatar, setNovoAvatar] = useState<string | null>(avatarUrl);
  const [arquivoParaRecorte, setArquivoParaRecorte] = useState<File | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>(sistemasFavoritos);
  const [textoBio, setTextoBio] = useState(bio ?? "");
  const [publico, setPublico] = useState(perfilPublico);

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
        nomeCompleto: formData.get("nomeCompleto"),
        telefone: formData.get("telefone"),
        bio: formData.get("bio"),
        sistemasFavoritos: favoritos,
        avatarUrl: novoAvatar,
        perfilPublico: publico,
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
              <div className="flex size-full items-center justify-center bg-marca text-lg font-semibold text-white">
                {iniciais(nome)}
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
          <p className="text-xs text-muted-foreground">{t("avatarAjuda")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeExibicao">{t("nomeExibicao")}</Label>
          <Input
            id="nomeExibicao"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeCompleto">{t("nomeCompleto")}</Label>
          <Input id="nomeCompleto" name="nomeCompleto" defaultValue={nomeCompleto ?? ""} maxLength={160} />
          <p className="text-xs text-muted-foreground">{t("nomeCompletoAjuda")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">{t("telefone")}</Label>
          <Input id="telefone" name="telefone" defaultValue={telefone ?? ""} maxLength={20} placeholder="31999999999" />
          <p className="text-xs text-muted-foreground">{t("telefoneAjuda")}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            {/* O limite é 280 e o campo trava em silêncio ao chegar lá: sem o
                contador, a pessoa só percebia que o texto parou de entrar. */}
            <span
              className={`text-xs tabular-nums ${
                textoBio.length >= 280 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {textoBio.length}/280
            </span>
          </div>
          <Textarea
            id="bio"
            name="bio"
            value={textoBio}
            onChange={(e) => setTextoBio(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{t("bioAjuda")}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("sistemasFavoritos")}</Label>
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

        <div className="space-y-2 rounded-xl border border-border bg-background/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox checked={publico} onCheckedChange={() => setPublico((v) => !v)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{t("perfilPublico")}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{t("perfilPublicoAjuda")}</span>
            </span>
          </label>
          {/* Fechar o perfil não esconde só a página: a policy
              `perfil_leitura_publica` para de devolver a linha, então o nome
              some também do "mestrada por" dos cards. Melhor dizer isso aqui
              do que a pessoa descobrir depois. */}
          {!publico && <p className="text-xs text-primary">{t("perfilPublicoAviso")}</p>}
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("salvando") : t("salvarPerfil")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancelar}>
            {t("cancelar")}
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
