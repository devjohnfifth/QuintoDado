/**
 * Divisor ornamental entre seções: um fio que nasce e morre no transparente,
 * com um losango no meio — a referência é o d20 visto de frente.
 *
 * Existe porque a borda reta de 1px entre todas as seções deixava a página
 * com cara de formulário. É decoração, então some pra leitor de tela.
 */
export function Filete({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${className ?? ""}`}>
      <span className="filete w-full max-w-40" />
      <span className="relative flex size-2.5 rotate-45 items-center justify-center border border-acento/50 bg-acento/20" />
      <span className="filete w-full max-w-40" />
    </div>
  );
}
