import Image, { type StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/site/container";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";

/**
 * Capa de página: a faixa que abre uma listagem.
 *
 * Antes as listas abriam com um quadradinho de ícone de 40px e um título
 * solto sobre preto — e só `/sobre` e `/presencial-bh` tinham imagem, o que
 * fazia o site parecer montado por pessoas diferentes. Aqui toda página
 * ganha a mesma faixa: imagem quando existe, trama de d20 e a silhueta do
 * dado quando não, e o título em display por cima.
 */
export function CapaPagina({
  icone: Icone,
  titulo,
  subtitulo,
  acoes,
  imagem,
}: {
  icone: LucideIcon;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  /** Foto de fundo. Sem ela, a capa se vira com trama e silhueta. */
  imagem?: StaticImageData;
}) {
  return (
    <section className="textura-grao relative isolate overflow-hidden border-b border-border/60">
      {imagem && (
        <Image src={imagem} alt="" fill priority className="-z-20 object-cover opacity-25" sizes="100vw" />
      )}

      <div aria-hidden className="textura-hex absolute inset-0 -z-10 opacity-[0.05]" />
      <D20MarcaDagua className="absolute -right-16 -top-20 -z-10 size-[22rem] text-foreground/[0.05] sm:-right-10 sm:size-[26rem]" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-background to-transparent"
      />

      <Container className="py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-acento/15 text-acento">
              <Icone className="size-6" aria-hidden />
            </div>
            <h1 className="titulo-display titulo-pagina mt-5">{titulo}</h1>
            {subtitulo && <p className="mt-3 max-w-2xl text-lg text-foreground/80">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
        </div>
      </Container>
    </section>
  );
}
