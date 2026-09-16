"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Trash2, Loader2, FileText } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  FORMATOS_ARQUIVO,
  FORMATO_LABEL,
  TAMANHO_MAXIMO_ARQUIVO,
  formatarTamanho,
  formatoPorNome,
  type FormatoArquivo,
} from "@/lib/suplementos/labels";
import { prepararUploadAction, registrarArquivoAction, removerArquivoAction } from "../../actions";

export type ArquivoExistente = {
  id: string;
  nome: string;
  formato: string;
  tamanhoBytes: number | null;
};

/**
 * PUT direto pro R2 com XMLHttpRequest porque `fetch` não expõe progresso de
 * upload — e arquivo de VTT pode chegar a 100 MB.
 */
function enviarComProgresso(url: string, arquivo: File, contentType: string, onProgresso: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("falha de rede"));
    xhr.send(arquivo);
  });
}

export function ArquivosSection({ suplementoId, arquivos }: { suplementoId: string; arquivos: ArquivoExistente[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);

    const formato = formatoPorNome(arquivo.name);
    if (!formato) {
      setErro(`Formato não aceito. Use ${FORMATOS_ARQUIVO.map((f) => FORMATO_LABEL[f as FormatoArquivo]).join(", ")}.`);
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErro("O arquivo passa de 100 MB.");
      return;
    }

    setProgresso(0);
    const preparo = await prepararUploadAction(suplementoId, { nome: arquivo.name, formato, tamanho: arquivo.size });
    if (!preparo.ok) {
      setProgresso(null);
      setErro(preparo.error);
      return;
    }

    try {
      await enviarComProgresso(preparo.url, arquivo, preparo.contentType, setProgresso);
    } catch (err) {
      console.error("[ArquivosSection] upload falhou:", err);
      setProgresso(null);
      setErro("O envio do arquivo falhou. Confira a conexão e tente de novo.");
      return;
    }

    const registro = await registrarArquivoAction(suplementoId, { nome: arquivo.name, chave: preparo.chave, formato });
    setProgresso(null);
    if (!registro.ok) {
      setErro(registro.error);
      return;
    }
    router.refresh();
  }

  function remover(arquivo: ArquivoExistente) {
    if (!confirm(`Remover "${arquivo.nome}"? Quem ainda não baixou não vai conseguir mais.`)) return;
    setErro(null);
    setRemovendo(arquivo.id);
    startTransition(async () => {
      const r = await removerArquivoAction(arquivo.id);
      setRemovendo(null);
      if (!r.ok) return setErro(r.error);
      router.refresh();
    });
  }

  const enviando = progresso !== null;

  return (
    <div className="space-y-3">
      {arquivos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Nenhum arquivo ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border">
          {arquivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <FileText className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{a.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {FORMATO_LABEL[a.formato as FormatoArquivo] ?? a.formato}
                {a.tamanhoBytes ? ` · ${formatarTamanho(a.tamanhoBytes)}` : ""}
              </span>
              <button
                type="button"
                onClick={() => remover(a)}
                disabled={removendo === a.id}
                aria-label={`Remover ${a.nome}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {removendo === a.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {enviando && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progresso}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Enviando… {progresso}%</p>
        </div>
      )}

      <Button type="button" variant="outline" disabled={enviando} onClick={() => inputRef.current?.click()} className="gap-2">
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {enviando ? "Enviando..." : "Adicionar arquivo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.json,.zip"
        onChange={aoEscolher}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        PDF, imagem (PNG, JPG, WebP) ou módulo de VTT (JSON, ZIP), até 100 MB. O nome do arquivo é o nome que a
        pessoa recebe ao baixar.
      </p>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
