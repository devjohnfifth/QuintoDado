import { Link } from "@/i18n/navigation";

export function LegalPage({
  titulo,
  corpo,
  atualizadoEm,
  voltar,
}: {
  titulo: string;
  corpo: string;
  atualizadoEm: string;
  voltar: string;
}) {
  const paragrafos = corpo.split("\n\n");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{titulo}</h1>
      <p className="mt-2 text-xs text-muted-foreground">{atualizadoEm}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {paragrafos.map((paragrafo, i) => (
          <p key={i}>{paragrafo}</p>
        ))}
      </div>

      <Link href="/" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
        ← {voltar}
      </Link>
    </div>
  );
}
