"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ExternalLink, Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import { Selo } from "@/components/site/selo";
import { iniciais } from "@/lib/perfil/iniciais";
import { EditarPerfilForm } from "./editar-perfil-form";

type Sistema = { id: string; nome: string };

/**
 * A capa da conta.
 *
 * Antes isto era um avatar de 56px e um nome em corpo de texto, enquanto
 * toda outra página do site abre com uma faixa de capa — a conta parecia
 * tela de configuração de outro produto. Agora segue a mesma linguagem:
 * trama, silhueta do d20 e o nome em display.
 *
 * É cliente porque o botão "Editar perfil" troca a capa pelo formulário no
 * mesmo lugar; o resto da página continua no servidor.
 */
export function PerfilSection({
  nomeExibicao,
  nomeCompleto,
  telefone,
  username,
  bio,
  avatarUrl,
  perfilPublico,
  papel,
  sistemasFavoritos,
  sistemas,
}: {
  nomeExibicao: string;
  nomeCompleto: string | null;
  telefone: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  perfilPublico: boolean;
  papel: string;
  sistemasFavoritos: string[];
  sistemas: Sistema[];
}) {
  const t = useTranslations("Conta");
  const [editando, setEditando] = useState(false);
  const nomesFavoritos = sistemas.filter((s) => sistemasFavoritos.includes(s.id)).map((s) => s.nome);
  const ehMestre = papel === "mestre" || papel === "admin";

  return (
    <section className="textura-grao relative isolate overflow-hidden border-b border-border/60">
      <div aria-hidden className="textura-hex absolute inset-0 -z-10 opacity-[0.05]" />
      <D20MarcaDagua className="absolute -right-16 -top-20 -z-10 size-[22rem] text-foreground/[0.05] sm:-right-10 sm:size-[26rem]" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-background to-transparent"
      />

      <Container className="py-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border sm:size-24">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" priority />
              ) : (
                <div className="flex size-full items-center justify-center bg-marca font-heading text-2xl font-bold text-white">
                  {iniciais(nomeExibicao)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="titulo-display titulo-secao">{nomeExibicao}</h1>
              {/* O @ virou link: era o único lugar do site que mostrava o
                  username e não levava a lugar nenhum. */}
              {perfilPublico ? (
                <Link
                  href={`/u/${username}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  @{username}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">@{username}</p>
              )}
              {ehMestre && (
                <div className="mt-2">
                  <Selo tom="marca">{t("seloMestre")}</Selo>
                </div>
              )}
            </div>
          </div>

          {!editando && (
            <div className="flex flex-wrap gap-2">
              {perfilPublico && (
                <Link
                  href={`/u/${username}`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
                >
                  <ExternalLink className="size-4" aria-hidden />
                  {t("verPerfilPublico")}
                </Link>
              )}
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditando(true)}>
                <Pencil className="size-4" aria-hidden />
                {t("editarPerfil")}
              </Button>
            </div>
          )}
        </div>

        {!editando && bio && <p className="mt-5 max-w-2xl text-foreground/80">{bio}</p>}

        {!editando && nomesFavoritos.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {nomesFavoritos.map((nome) => (
              <li
                key={nome}
                className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {nome}
              </li>
            ))}
          </ul>
        )}

        {editando && (
          <EditarPerfilForm
            nomeExibicao={nomeExibicao}
            nomeCompleto={nomeCompleto}
            telefone={telefone}
            bio={bio}
            avatarUrl={avatarUrl}
            perfilPublico={perfilPublico}
            sistemasFavoritos={sistemasFavoritos}
            sistemas={sistemas}
            onCancelar={() => setEditando(false)}
          />
        )}
      </Container>
    </section>
  );
}
