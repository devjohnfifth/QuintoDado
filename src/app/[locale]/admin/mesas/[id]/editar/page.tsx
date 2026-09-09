import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { NovaMesaAdminForm, type MesaExistente } from "../../nova/nova-mesa-admin-form";

export default async function EditarMesaAdminPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: mesa }, { data: sistemas }] = await Promise.all([
    supabase
      .from("mesas")
      .select(
        "titulo, sistema_id, sistema_outro, sinopse, tipo, modalidade, cidade_uf, plataforma_vtt, plataforma_voz, frequencia, qtd_sessoes, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, classificacao, nivel_experiencia, preco_centavos, cobranca_gerenciada_pelo_site, banner_url",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("sistemas").select("id, nome, slug").eq("ativo", true).order("nome"),
  ]);

  if (!mesa) notFound();

  const mesaExistente: MesaExistente = {
    titulo: mesa.titulo,
    sistemaId: mesa.sistema_id,
    sistemaOutroNome: mesa.sistema_outro,
    sinopse: mesa.sinopse,
    tipo: mesa.tipo,
    modalidade: mesa.modalidade,
    cidadeUf: mesa.cidade_uf,
    plataformaVtt: mesa.plataforma_vtt,
    plataformaVoz: mesa.plataforma_voz,
    frequencia: mesa.frequencia,
    qtdSessoes: mesa.qtd_sessoes,
    dataInicio: mesa.data_inicio,
    horarioInicio: mesa.horario_inicio,
    horarioFim: mesa.horario_fim,
    vagasTotal: mesa.vagas_total,
    minJogadores: mesa.min_jogadores,
    classificacao: mesa.classificacao,
    nivelExperiencia: mesa.nivel_experiencia,
    gratuita: mesa.preco_centavos === 0,
    valorReais: mesa.preco_centavos > 0 ? mesa.preco_centavos / 100 : null,
    cobrancaGerenciadaPeloSite: mesa.cobranca_gerenciada_pelo_site,
    bannerUrl: mesa.banner_url,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        <Link href={`/admin/mesas/${id}`} className="hover:underline">
          ← Voltar pra mesa
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold">Editar mesa</h1>
      <NovaMesaAdminForm sistemas={sistemas ?? []} mesaId={id} mesaExistente={mesaExistente} />
    </div>
  );
}
