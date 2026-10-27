"use client";

import { useEffect, useRef } from "react";

/**
 * Brilho que segue o cursor dentro do card.
 *
 * Fica dentro de um pai `relative` e escuta o ponteiro nele. Cliente só por
 * causa disso — o card em volta continua sendo componente de servidor, que
 * é o que importa pro peso da página.
 *
 * Em tela de toque não acontece nada (não há ponteiro pra seguir), e com
 * movimento reduzido o efeito nem é ligado.
 */
export function BrilhoCursor({ cor = "var(--qd-primaria)" }: { cor?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const pai = el?.parentElement;
    if (!el || !pai) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function mover(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !el || !pai) return;
      const r = pai.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    }

    pai.addEventListener("pointermove", mover);
    return () => pai.removeEventListener("pointermove", mover);
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        backgroundImage: `radial-gradient(22rem circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklch, ${cor} 18%, transparent), transparent 60%)`,
      }}
    />
  );
}
