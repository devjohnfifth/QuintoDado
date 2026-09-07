"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Revela o conteúdo (fade + slide sutil) quando ele entra na viewport.
 * Roda uma vez só; sem efeito nenhum se prefers-reduced-motion (a classe
 * motion-safe: cuida disso) — micro-interação com propósito (indicar que
 * a página continua), não decoração.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${
        visivel ? "motion-safe:animate-[reveal-up_0.6s_ease-out_backwards]" : "motion-safe:opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
