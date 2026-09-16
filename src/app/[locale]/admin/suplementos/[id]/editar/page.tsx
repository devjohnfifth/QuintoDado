import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Dado, Tabela } from "@/lib/suplementos/dados";
import { SuplementoDadosForm } from "../../suplemento-dados-form";
import { PublicadoToggle } from "./publicado-toggle";
import { ArquivosSection } from "./arquivos-section";
import { TabelasEditor } from "./tabelas-editor";

export default async function EditarSuplementoPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: s }, { data: sistemas }, { data: arquivos, error: arqError }, { data: tabelasDb, error: tabError }] =
    await Promise.all([
      supabase
        .from("suplementos")
        .select(
          "id, slug, titulo, resumo, descricao_md, tipo, sistema_id, classificacao, capa_url, usa_ia, licenca_base, atribuicao, publicado, downloads_count",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("sistemas").select("id, nome").eq("ativo", true).neq("slug", "outro").order("nome"),
      supabase
        .from("arquivos_suplemento")
        .select("id, nome, formato, tamanho_bytes")
        .eq("suplemento_id", id)
        .is("removido_em", null)
        .order("ordem"),
      supabase
        .from("tabelas_aleatorias")
        .select("id, titulo, dado, colunas, ordem, tabela_itens!tabela_itens_tabela_id_fkey(faixa_min, faixa_max, valores, tabela_aninhada_id)")
        .eq("suplemento_id", id)
        .order("ordem"),
    ]);

  if (!s) notFound();
  if (arqError) console.error("[admin/suplementos/editar] arquivos:", arqError.message);
  if (tabError) console.error("[admin/suplementos/editar] tabelas:", tabError.message);

  // No editor a chave da tabela é o próprio id do banco; a RPC troca os ids a
  // cada save, mas as referências aninhadas continuam consistentes entre si.
  const tabelas: Tabela[] = (tabelasDb ?? []).map((t) => {
    const itens = (t.tabela_itens as unknown as {
      faixa_min: number;
      faixa_max: number;
      valores: string[];
      tabela_aninhada_id: string | null;
    }[]) ?? [];
    return {
      chave: t.id,
      titulo: t.titulo,
      dado: t.dado as Dado,
      colunas: t.colunas,
      itens: itens
        .sort((a, b) => a.faixa_min - b.faixa_min)
        .map((i) => ({ faixaMin: i.faixa_min, faixaMax: i.faixa_max, valores: i.valores, aninhada: i.tabela_aninhada_id })),
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/suplementos" className="hover:underline">
          ← Voltar pra suplementos
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold">{s.titulo}</h1>
        {s.publicado && (
          <Link
            href={`/suplementos/${s.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Ver página pública
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        /suplementos/{s.slug} · {s.downloads_count} download{s.downloads_count === 1 ? "" : "s"}
      </p>

      <div className="mt-6">
        <PublicadoToggle suplementoId={s.id} publicado={s.publicado} />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold">Dados</h2>
        <div className="mt-4">
          <SuplementoDadosForm
            suplementoId={s.id}
            sistemas={sistemas ?? []}
            existente={{
              titulo: s.titulo,
              resumo: s.resumo,
              descricaoMd: s.descricao_md ?? "",
              tipo: s.tipo,
              sistemaId: s.sistema_id,
              classificacao: s.classificacao,
              capaUrl: s.capa_url,
              usaIa: s.usa_ia,
              licencaBase: s.licenca_base ?? "",
              atribuicao: s.atribuicao ?? "",
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-bold">Arquivos pra baixar</h2>
        <div className="mt-4">
          <ArquivosSection
            suplementoId={s.id}
            arquivos={(arquivos ?? []).map((a) => ({
              id: a.id,
              nome: a.nome,
              formato: a.formato,
              tamanhoBytes: a.tamanho_bytes,
            }))}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-bold">Tabelas aleatórias</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Roladas direto na página. O resultado de uma tabela pode mandar rolar outra (aninhada).
        </p>
        <div className="mt-4">
          <TabelasEditor suplementoId={s.id} iniciais={tabelas} />
        </div>
      </section>
    </div>
  );
}
