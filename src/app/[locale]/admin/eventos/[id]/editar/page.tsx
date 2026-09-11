import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventoForm, type EventoExistente } from "../../evento-form";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: evento }, { data: tipos }] = await Promise.all([
    supabase
      .from("eventos")
      .select(
        "titulo, subtitulo, descricao, cidade_uf, local, data_inicio, data_fim, horario_inicio, horario_fim, chave_pix, whatsapp_confirmacao, capacidade_maxima, banner_url",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("evento_ingresso_tipos")
      .select("id, nome, descricao, preco_centavos")
      .eq("evento_id", id)
      .eq("ativo", true)
      .order("ordem"),
  ]);

  if (!evento) notFound();

  const eventoExistente: EventoExistente = {
    titulo: evento.titulo,
    subtitulo: evento.subtitulo ?? "",
    descricao: evento.descricao,
    cidadeUf: evento.cidade_uf,
    local: evento.local ?? "",
    dataInicio: evento.data_inicio,
    dataFim: evento.data_fim ?? "",
    horarioInicio: evento.horario_inicio?.slice(0, 5) ?? "",
    horarioFim: evento.horario_fim?.slice(0, 5) ?? "",
    chavePix: evento.chave_pix ?? "",
    whatsappConfirmacao: evento.whatsapp_confirmacao ?? "",
    capacidadeMaxima: evento.capacidade_maxima,
    bannerUrl: evento.banner_url,
    tipos: (tipos ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      descricao: t.descricao ?? "",
      precoReais: t.preco_centavos / 100,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        <Link href={`/admin/eventos/${id}`} className="hover:underline">
          ← Voltar pro evento
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold">Editar evento</h1>
      <EventoForm eventoId={id} eventoExistente={eventoExistente} />
    </div>
  );
}
