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
  admin: "border-amber-500/40 text-amber-400",
};

export function UsuariosTable({ usuarios }: { usuarios: UsuarioLinha[] }) {
  const [busca, setBusca] = useState("");
  const [excluindo, setExcluindo] = useState<UsuarioLinha | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) => u.nomeExibicao.toLowerCase().includes(termo) || u.username.toLowerCase().includes(termo),
    );
  }, [usuarios, busca]);

  return (
    <div>
      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
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
              {filtrados.map((u) => (
                <LinhaUsuario key={u.id} usuario={u} onPedirExclusao={() => setExcluindo(u)} />
              ))}
            </tbody>
          </table>
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
          <span className="ml-1.5 text-xs text-amber-400">pediu pra ser mestre</span>
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
