"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que conta até o valor quando entra na tela.
 *
 * Nasce já com o valor final (é o que vai no HTML do servidor), então não há
 * divergência de hidratação, não some pra quem está sem JS e o robô de busca
 * lê o número certo. A contagem só começa depois, no efeito — e nem começa
 * se a pessoa pediu menos movimento.
 */
export function NumeroAnimado({ valor, duracao = 900 }: { valor: number; duracao?: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);
  const jaRodou = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || jaRodou.current || valor <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0]?.isIntersecting || jaRodou.current) return;
        jaRodou.current = true;
        observador.disconnect();

        const inicio = performance.now();
        let quadro = 0;
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          // Desaceleração no fim: o número "assenta" em vez de parar seco.
          const suave = 1 - Math.pow(1 - t, 3);
          setMostrado(Math.round(valor * suave));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        setMostrado(0);
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
      },
      { threshold: 0.4 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [valor, duracao]);

  return (
    <span ref={ref} className="tabular-nums">
      {mostrado}
    </span>
  );
}
