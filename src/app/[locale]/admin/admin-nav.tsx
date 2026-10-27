"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

const SECOES = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/mesas", label: "Mesas" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/suplementos", label: "Suplementos" },
  { href: "/admin/usuarios", label: "Usuários" },
] as const;

/** Rotas de formulário: criar e editar. Lá o nav de seções só atrapalha. */
const EH_FORMULARIO = /\/(nova|novo|editar)$/;

/**
 * Navegação do admin.
 *
 * Em tela de formulário (criar/editar) ela some e dá lugar a um "voltar":
 * ali a pessoa está no meio de uma tarefa, e oferecer cinco saídas no topo
 * só convida a perder o que foi preenchido.
 */
export function AdminNav() {
  const caminho = usePathname();
  const atual = SECOES.find((s) => s.href !== "/admin" && caminho.includes(s.href));

  if (EH_FORMULARIO.test(caminho)) {
    return (
      <p className="mb-8 text-sm">
        <Link
          href={atual?.href ?? "/admin"}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar pra {atual?.label.toLowerCase() ?? "o painel"}
        </Link>
      </p>
    );
  }

  return (
    <nav className="mb-8 flex gap-4 border-b border-border/60 pb-4 text-sm font-medium">
      {SECOES.map((s) => {
        const ativo = s.href === "/admin" ? caminho.endsWith("/admin") : caminho.includes(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={ativo ? "page" : undefined}
            className={
              ativo
                ? "border-b-2 border-acento pb-1 text-foreground"
                : "pb-1 text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
