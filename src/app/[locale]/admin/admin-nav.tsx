"use client";

import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const atual = SECOES.find((s) => s.href !== "/admin" && caminho.includes(s.href));

  if (EH_FORMULARIO.test(caminho)) {
    /*
     * "Voltar" volta pra onde a pessoa estava, não pra um lugar fixo. O
     * formulário de nova mesa é alcançado tanto pelo /admin/mesas quanto
     * pelo botão de admin na /mesas pública — mandar sempre pro admin
     * tirava quem veio da lista pública do lugar dela.
     *
     * O href continua apontando pra seção: é o que vale sem JS e pra quem
     * abriu o endereço direto, sem histórico pra onde voltar.
     */
    const destino = atual?.href ?? "/admin";
    return (
      <p className="mb-8 text-sm">
        <Link
          href={destino}
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              router.back();
            }
          }}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar
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
                ? "border-b-2 border-primary pb-1 text-foreground"
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
