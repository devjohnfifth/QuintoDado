import { EventoForm } from "../evento-form";

export default function NovoEventoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="titulo-display titulo-secao">Novo evento</h1>
      <EventoForm />
    </div>
  );
}
