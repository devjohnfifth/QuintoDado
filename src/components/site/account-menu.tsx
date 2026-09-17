"use client";

import { LayoutDashboard, LogOut, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sairAction } from "@/app/[locale]/entrar/actions";

type Perfil = {
  nomeExibicao: string;
  username: string;
  avatarUrl: string | null;
  papel: string;
};

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AccountMenu({ perfil }: { perfil: Perfil }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={perfil.nomeExibicao}
            className="flex items-center gap-2 rounded-full border border-border p-1 transition-colors hover:border-primary/40 sm:pr-3"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarImage src={perfil.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-marca text-xs font-semibold text-white">
            {iniciais(perfil.nomeExibicao)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">
          {primeiroNome(perfil.nomeExibicao)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">@{perfil.username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/conta" />}>
            <User className="size-4" aria-hidden />
            Minha conta
          </DropdownMenuItem>
          {perfil.papel === "admin" && (
            <DropdownMenuItem render={<Link href="/admin" />}>
              <LayoutDashboard className="size-4" aria-hidden />
              Painel admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              sairAction();
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
