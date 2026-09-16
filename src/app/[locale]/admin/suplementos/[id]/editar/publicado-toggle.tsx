"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { alternarPublicacaoAction } from "../../actions";

export function PublicadoToggle({ suplementoId, publicado: inicial }: { suplementoId: string; publicado: boolean }) {
  const router = useRouter();
  const [publicado, setPublicado] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar() {
    setErro(null);
    const novo = !publicado;
    startTransition(async () => {
      const r = await alternarPublicacaoAction(suplementoId, novo);
      if (!r.ok) return setErro(r.error);
      setPublicado(novo);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 p-4">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
          publicado ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
        }`}
      >
        {publicado ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{publicado ? "Publicado" : "Rascunho"}</p>
        <p className="text-xs text-muted-foreground">
          {publicado
            ? "Aparece no catálogo, no sitemap e no RSS."
            : "Só você vê. Ligue quando os arquivos e as tabelas estiverem prontos."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={publicado}
        aria-label={publicado ? "Publicado — clique pra voltar a rascunho" : "Rascunho — clique pra publicar"}
        disabled={pending}
        onClick={alternar}
        className={`group relative h-8 w-[3.25rem] shrink-0 rounded-full p-1 shadow-inner transition-colors duration-300 ease-out disabled:opacity-60 ${
          publicado ? "bg-emerald-500" : "bg-[#3a3a46]"
        }`}
      >
        <span
          className={`block size-6 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
            publicado ? "translate-x-[1.375rem]" : "translate-x-0"
          }`}
        />
      </button>
      {erro && <p className="w-full text-xs text-destructive">{erro}</p>}
    </div>
  );
}
