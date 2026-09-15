import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/**
 * Renderiza a descrição de uma mesa escrita em Markdown.
 *
 * HTML cru fica desligado de propósito (é o padrão do react-markdown): a
 * descrição é texto que qualquer mestre cadastrado escreve, então `<script>`
 * ou `<img onerror=...>` colado ali tem que sair como texto literal na tela,
 * não executar. Por isso também não existe `rehype-raw` aqui.
 *
 * `remark-breaks` está aqui pelas sinopses antigas: elas foram escritas como
 * texto puro com quebras de linha reais, e Markdown padrão juntaria essas
 * linhas num parágrafo só.
 */
export function DescricaoMarkdown({ texto }: { texto: string }) {
  return (
    <div className="text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-6 font-heading text-2xl font-bold text-foreground first:mt-0">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-6 font-heading text-xl font-bold text-foreground first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-5 font-heading text-lg font-bold text-foreground first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 italic text-foreground/90">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          // Sem next/image de propósito: a URL vem do texto que o mestre
          // escreveu, e o next/image só aceita domínios do next.config.
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? src : ""}
              alt={alt ?? ""}
              loading="lazy"
              className="mt-4 w-full rounded-xl border border-border object-cover"
            />
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{children}</code>
          ),
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
