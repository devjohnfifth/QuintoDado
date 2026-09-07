"use client";

import { useState, useTransition } from "react";
import { Bell, BellDot } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buscarNotificacoesAction, marcarNotificacaoLidaAction } from "@/app/[locale]/notificacoes/actions";

type Notificacao = {
  id: string;
  titulo: string;
  corpo: string;
  url: string | null;
  lida_em: string | null;
  criado_em: string;
};

export function NotificationBell({ naoLidasIniciais }: { naoLidasIniciais: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [naoLidas, setNaoLidas] = useState(naoLidasIniciais);
  const [notificacoes, setNotificacoes] = useState<Notificacao[] | null>(null);

  function aoAbrir(aberto: boolean) {
    if (aberto && notificacoes === null) {
      startTransition(async () => {
        const dados = await buscarNotificacoesAction();
        setNotificacoes(dados);
      });
    }
  }

  function aoClicarNotificacao(n: Notificacao) {
    if (!n.lida_em) {
      setNaoLidas((v) => Math.max(0, v - 1));
      marcarNotificacaoLidaAction(n.id);
    }
    if (n.url) router.push(n.url);
  }

  return (
    <DropdownMenu onOpenChange={aoAbrir}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
        aria-label="Notificações"
      >
        {naoLidas > 0 ? <BellDot className="size-5" /> : <Bell className="size-5" />}
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {pending && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">Carregando...</p>
          )}
          {!pending && notificacoes?.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </p>
          )}
          {!pending &&
            notificacoes?.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => aoClicarNotificacao(n)}
                className="flex-col items-start whitespace-normal"
              >
                <span className={`text-sm ${n.lida_em ? "font-normal" : "font-semibold"}`}>
                  {n.titulo}
                </span>
                <span className="text-xs text-muted-foreground">{n.corpo}</span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
