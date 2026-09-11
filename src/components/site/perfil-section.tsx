"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EditarPerfilForm } from "./editar-perfil-form";

type Sistema = { id: string; nome: string };

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PerfilSection({
  nomeExibicao,
  nomeCompleto,
  username,
  bio,
  avatarUrl,
  sistemasFavoritos,
  sistemas,
}: {
  nomeExibicao: string;
  nomeCompleto: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  sistemasFavoritos: string[];
  sistemas: Sistema[];
}) {
  const [editando, setEditando] = useState(false);
  const nomesFavoritos = sistemas
    .filter((s) => sistemasFavoritos.includes(s.id))
    .map((s) => s.nome);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="56px" />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-lg font-semibold text-white">
                {iniciais(nomeExibicao)}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">{nomeExibicao}</h1>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>
        </div>
        {!editando && (
          <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
            Editar perfil
          </Button>
        )}
      </div>

      {!editando && bio && <p className="mt-4 text-sm text-muted-foreground">{bio}</p>}

      {!editando && nomesFavoritos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {nomesFavoritos.map((nome) => (
            <span
              key={nome}
              className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {nome}
            </span>
          ))}
        </div>
      )}

      {editando && (
        <EditarPerfilForm
          nomeExibicao={nomeExibicao}
          nomeCompleto={nomeCompleto}
          bio={bio}
          avatarUrl={avatarUrl}
          sistemasFavoritos={sistemasFavoritos}
          sistemas={sistemas}
          onCancelar={() => setEditando(false)}
        />
      )}
    </div>
  );
}
