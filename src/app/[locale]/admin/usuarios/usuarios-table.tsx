"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promoverMestreAction, excluirUsuarioAction } from "./actions";

export type UsuarioLinha = {
  id: string;
  username: string;
  nomeExibicao: string;
  idade: number;
  papel: "usuario" | "mestre" | "admin";
  mestreSolicitado: boolean;
};

const PAPEL_LABEL: Record<UsuarioLinha["papel"], string> = {
  usuario: "Usuário",
  mestre: "Mestre",
  admin: "Admin",
};

const PAPEL_COR: Record<UsuarioLinha["papel"], string> = {
  usuario: "border-border text-muted-foreground",
  mestre: "border-primary/40 text-primary",
  admin: "border-alerta/40 text-alerta",
};

/** Quantas pessoas por página na tabela. */
const POR_PAGINA = 25;

export function UsuariosTable({ usuarios }: { usuarios: UsuarioLinha[] }) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<UsuarioLinha | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) => u.nomeExibicao.toLowerCase().includes(termo) || u.username.toLowerCase().includes(termo),
    );
  }, [usuarios, busca]);

  // A paginação é no cliente de propósito: a busca varre todo mundo, não só a
  // página aberta. Se a base crescer a ponto de pesar, a busca é que precisa
  // ir pro servidor primeiro — aí a paginação vai junto.
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <div>
      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por nome ou usuário..."
          className="pl-9"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Usuário</th>
                <th className="py-2 pr-4">Idade</th>
                <th className="py-2 pr-4">Papel</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((u) => (
                <LinhaUsuario key={u.id} usuario={u} onPedirExclusao={() => setExcluindo(u)} />
              ))}
            </tbody>
          </table>

          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="rounded-full border border-border px-4 py-2 transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
              >
                Anterior
              </button>
              <span className="text-muted-foreground">
                Página {paginaAtual} de {totalPaginas} · {filtrados.length}{" "}
                {filtrados.length === 1 ? "pessoa" : "pessoas"}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="rounded-full border border-border px-4 py-2 transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(excluindo)} onOpenChange={(open) => !open && setExcluindo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {excluindo?.nomeExibicao}?</DialogTitle>
            <DialogDescription>
              A conta, o perfil e o histórico de candidaturas dessa pessoa somem pra sempre. Isso não
              pode ser desfeito.
            </DialogDescription>
          </DialogHeader>
          <ExcluirConfirmacao usuario={excluindo} onFechar={() => setExcluindo(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinhaUsuario({
  usuario,
  onPedirExclusao,
}: {
  usuario: UsuarioLinha;
  onPedirExclusao: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [promovido, setPromovido] = useState(false);

  const papelAtual = promovido ? "mestre" : usuario.papel;

  return (
    <tr className="border-b border-border/60 transition-colors duration-200 hover:bg-accent/40">
      <td className="py-3 pr-4 font-medium">{usuario.nomeExibicao}</td>
      <td className="py-3 pr-4 text-muted-foreground">@{usuario.username}</td>
      <td className="py-3 pr-4 text-muted-foreground">{usuario.idade}</td>
      <td className="py-3 pr-4">
        <span className={`rounded-full border px-2 py-0.5 text-xs ${PAPEL_COR[papelAtual]}`}>
          {PAPEL_LABEL[papelAtual]}
        </span>
        {usuario.mestreSolicitado && papelAtual === "usuario" && (
          <span className="ml-1.5 text-xs text-alerta">pediu pra ser mestre</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex items-center justify-end gap-3">
          {erro && <span className="text-xs text-destructive">{erro}</span>}
          {papelAtual === "usuario" && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setErro(null);
                  const resultado = await promoverMestreAction(usuario.id);
                  if (!resultado.ok) {
                    setErro(resultado.error);
                    return;
                  }
                  setPromovido(true);
                })
              }
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Promover a mestre
            </button>
          )}
          {papelAtual !== "admin" && (
            <button
              type="button"
              onClick={onPedirExclusao}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:underline"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Excluir
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ExcluirConfirmacao({
  usuario,
  onFechar,
}: {
  usuario: UsuarioLinha | null;
  onFechar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Voltar</DialogClose>
        <Button
          variant="destructive"
          disabled={pending || !usuario}
          onClick={() =>
            startTransition(async () => {
              if (!usuario) return;
              setErro(null);
              const resultado = await excluirUsuarioAction(usuario.id);
              if (!resultado.ok) {
                setErro(resultado.error);
                return;
              }
              onFechar();
            })
          }
        >
          {pending ? "Excluindo..." : "Sim, excluir usuário"}
        </Button>
      </DialogFooter>
    </>
  );
}
