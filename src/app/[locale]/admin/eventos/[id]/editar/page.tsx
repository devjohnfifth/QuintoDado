import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
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

  const [{ data: evento }, { data: tipos }, { data: imagens }, { data: apoiadores }, { data: atracoes }, { data: mestres }] =
    await Promise.all([
      supabase
        .from("eventos")
        .select(
          "titulo, subtitulo, descricao, cidade_uf, local, data_inicio, data_fim, horario_inicio, horario_fim, chave_pix, whatsapp_confirmacao, capacidade_maxima, banner_url",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("evento_ingresso_tipos")
        .select("id, nome, descricao, preco_centavos, limite_mesas")
        .eq("evento_id", id)
        .eq("ativo", true)
        .order("ordem"),
      supabase.from("evento_imagens").select("url").eq("evento_id", id).order("ordem"),
      supabase.from("evento_apoiadores").select("nome, logo_url, link").eq("evento_id", id).order("ordem"),
      supabase.from("evento_atracoes").select("horario, titulo, descricao").eq("evento_id", id).order("ordem"),
      supabase
        .from("evento_mestres")
        .select("profiles(id, nome_exibicao, username, avatar_url)")
        .eq("evento_id", id)
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
      limiteMesas: t.limite_mesas,
    })),
    imagens: (imagens ?? []).map((i) => i.url),
    apoiadores: (apoiadores ?? []).map((a) => ({ nome: a.nome, logoUrl: a.logo_url, link: a.link ?? "" })),
    atracoes: (atracoes ?? []).map((a) => ({
      horario: a.horario ?? "",
      titulo: a.titulo,
      descricao: a.descricao ?? "",
    })),
    mestres: (mestres ?? [])
      .map((m) => m.profiles as unknown as { id: string; nome_exibicao: string; username: string; avatar_url: string | null } | null)
      .filter((p): p is NonNullable<typeof p> => p !== null),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Link href={`/admin/eventos/${id}`} className="hover:underline">
            ← Voltar pro evento
          </Link>
        </p>
        <Link
          href={`/admin/mesas/nova?eventoId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="size-3.5" aria-hidden />
          Adicionar mesa
        </Link>
      </div>
      <h1 className="mt-2 font-heading text-2xl font-bold">Editar evento</h1>
      <EventoForm eventoId={id} eventoExistente={eventoExistente} />
    </div>
  );
}
