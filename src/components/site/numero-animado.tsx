"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que conta até o valor quando entra na tela.
 *
 * Nasce já com o valor final (é o que vai no HTML do servidor), então não há
 * divergência de hidratação, não some pra quem está sem JS e o robô de busca
 * lê o número certo.
 *
 * A contagem começa depois, no efeito, e nunca pode deixar o número errado na
 * tela: `requestAnimationFrame` não roda com a aba em segundo plano, e sem a
 * trava abaixo o número ficava parado no zero inicial, mostrando "0 mesas
 * abertas" pra quem voltasse pra aba. Por isso: não anima com a página
 * escondida, e um `setTimeout` garante o valor final mesmo se os quadros
 * nunca vierem.
 */
export function NumeroAnimado({ valor, duracao = 900 }: { valor: number; duracao?: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);
  const jaRodou = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || jaRodou.current || valor <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let quadro = 0;
    let trava = 0;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0]?.isIntersecting || jaRodou.current) return;
        // Página escondida: nem começa, pra não zerar o número e travar nele.
        if (document.visibilityState !== "visible") return;

        jaRodou.current = true;
        observador.disconnect();

        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          // Desaceleração no fim: o número "assenta" em vez de parar seco.
          setMostrado(Math.round(valor * (1 - Math.pow(1 - t, 3))));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };

        setMostrado(0);
        quadro = requestAnimationFrame(passo);
        // Rede de segurança: timer dispara mesmo sem quadros de animação.
        trava = window.setTimeout(() => setMostrado(valor), duracao + 400);
      },
      { threshold: 0.4 },
    );

    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
      clearTimeout(trava);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref} className="tabular-nums">
      {mostrado}
    </span>
  );
}
