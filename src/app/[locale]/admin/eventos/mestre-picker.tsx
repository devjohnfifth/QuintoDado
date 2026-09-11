"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buscarUsuariosAction, type UsuarioBusca } from "./actions";

export type MestreSelecionado = UsuarioBusca;

export function MestrePicker({
  selecionados,
  onChange,
}: {
  selecionados: MestreSelecionado[];
  onChange: (mestres: MestreSelecionado[]) => void;
}) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (busca.trim().length < 2) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const dados = await buscarUsuariosAction(busca);
        setResultados(dados.filter((u) => !selecionados.some((s) => s.id === u.id)));
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function adicionar(usuario: UsuarioBusca) {
    onChange([...selecionados, usuario]);
    setBusca("");
    setResultados([]);
  }

  function remover(id: string) {
    onChange(selecionados.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou usuário..."
          className="pl-9"
        />
        {(resultados.length > 0 || pending) && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            {pending ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
            ) : (
              resultados.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => adicionar(u)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-[10px] font-bold text-white">
                      {u.nome_exibicao.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{u.nome_exibicao}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selecionados.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selecionados.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2 text-sm"
            >
              {m.avatar_url ? (
                <Image src={m.avatar_url} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-[10px] font-bold text-white">
                  {m.nome_exibicao.charAt(0).toUpperCase()}
                </span>
              )}
              {m.nome_exibicao}
              <button
                type="button"
                onClick={() => remover(m.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${m.nome_exibicao}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
