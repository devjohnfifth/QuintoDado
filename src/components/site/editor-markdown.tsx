"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Heading2, List, Quote, Minus, ImageUp, Loader2, Eye, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { enviarImagem } from "@/lib/storage/enviar-imagem";
import { DescricaoMarkdown } from "./descricao-markdown";

type Marcacao = {
  titulo: string;
  Icon: typeof Bold;
  /** O que envolve o texto selecionado (negrito, itálico). */
  envolve?: string;
  /** O que entra no começo da linha (título, lista, citação). */
  prefixo?: string;
  /** Bloco inteiro inserido sozinho (linha divisória). */
  bloco?: string;
};

const MARCACOES: Marcacao[] = [
  { titulo: "Negrito", Icon: Bold, envolve: "**" },
  { titulo: "Itálico", Icon: Italic, envolve: "_" },
  { titulo: "Título", Icon: Heading2, prefixo: "## " },
  { titulo: "Lista", Icon: List, prefixo: "- " },
  { titulo: "Citação em destaque", Icon: Quote, prefixo: "> " },
  { titulo: "Linha divisória", Icon: Minus, bloco: "\n---\n" },
];

export function EditorMarkdown({
  name,
  defaultValue = "",
  bucket = "mesa-banners",
}: {
  name: string;
  defaultValue?: string;
  bucket?: string;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(defaultValue);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState(false);

  /** Insere marcação na posição do cursor e devolve o foco pro textarea. */
  function aplicar(m: Marcacao) {
    const area = areaRef.current;
    if (!area) return;

    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const selecionado = texto.slice(inicio, fim);

    let novoTexto: string;
    let novoCursor: number;

    if (m.bloco) {
      novoTexto = texto.slice(0, fim) + m.bloco + texto.slice(fim);
      novoCursor = fim + m.bloco.length;
    } else if (m.envolve) {
      const conteudo = selecionado || "texto";
      novoTexto = texto.slice(0, inicio) + m.envolve + conteudo + m.envolve + texto.slice(fim);
      novoCursor = inicio + m.envolve.length + conteudo.length;
    } else {
      // Prefixo de linha: volta até o começo da linha onde o cursor está.
      const comecoLinha = texto.lastIndexOf("\n", inicio - 1) + 1;
      novoTexto = texto.slice(0, comecoLinha) + m.prefixo + texto.slice(comecoLinha);
      novoCursor = inicio + (m.prefixo?.length ?? 0);
    }

    setTexto(novoTexto);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(novoCursor, novoCursor);
    });
  }

  async function aoEscolherImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);

    const resultado = await enviarImagem(arquivo, bucket);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    const area = areaRef.current;
    const posicao = area?.selectionEnd ?? texto.length;
    const markdown = `\n![](${resultado.url})\n`;
    setTexto(texto.slice(0, posicao) + markdown + texto.slice(posicao));
    setEnviando(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
        {MARCACOES.map((m) => (
          <button
            key={m.titulo}
            type="button"
            title={m.titulo}
            aria-label={m.titulo}
            disabled={previa}
            onClick={() => aplicar(m)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <m.Icon className="size-4" aria-hidden />
          </button>
        ))}

        <button
          type="button"
          title="Inserir imagem"
          aria-label="Inserir imagem"
          disabled={enviando || previa}
          onClick={() => inputRef.current?.click()}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
        </button>

        <button
          type="button"
          onClick={() => setPrevia((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {previa ? <Pencil className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
          {previa ? "Escrever" : "Pré-visualizar"}
        </button>
      </div>

      {/* O valor vai no form por um input escondido pra continuar funcionando
          igual aos outros campos (FormData), inclusive na pré-visualização. */}
      <input type="hidden" name={name} value={texto} />

      {previa ? (
        <div className="min-h-[220px] rounded-lg border border-border bg-card/40 p-4">
          {texto.trim() ? (
            <DescricaoMarkdown texto={texto} />
          ) : (
            <p className="text-sm text-muted-foreground">Nada escrito ainda.</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={areaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={12}
          placeholder="Conte do que é a mesa. Dá pra usar títulos, listas, citação em destaque, linha divisória e imagens pelos botões acima."
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={aoEscolherImagem}
        className="hidden"
      />

      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
