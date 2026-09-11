import { EventoForm } from "../evento-form";

export default function NovoEventoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold">Novo evento</h1>
      <EventoForm />
    </div>
  );
}
