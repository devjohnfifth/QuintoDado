import { MapPin, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SITE_LINKS } from "@/lib/site-links";
import { Container } from "@/components/site/container";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { FiltroCidades } from "@/components/site/filtro-cidades";
import { Paginacao, fatiar } from "@/components/site/paginacao";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { minhasInscricoes } from "@/lib/mesas/minhas-inscricoes";
import {
  CIDADES_PRESENCIAIS,
  SLUG_CIDADE,
  listaDeCidades,
  type CidadePresencial,
} from "@/lib/mesas/cidades";
import { lotadasPorUltimo } from "@/lib/mesas/vagas";
import { buttonVariants } from "@/components/ui/button";

/**
 * O miolo de `/presencial` e de `/presencial/[cidade]`.
 *
 * As duas páginas mostram a mesma coisa — filtro, lista, paginação e os três
 * passos de quem quer publicar. O que muda é o título, a meta e se a lista
 * está presa a uma cidade. Em vez de duas cópias que vão divergir na primeira
 * mudança de texto, o conteúdo mora aqui e cada página cuida só do seu topo.
 */

/** Quantas mesas por página. */
const POR_PAGINA = 12;

export async function buscarMesasPresenciais(): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[/presencial] Supabase não configurado — mostrando estado vazio (ver .env.example).");
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select(
      "id, slug, titulo, sinopse, tipo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, qtd_sessoes, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, link_externo, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo), profiles!mesas_mestre_id_fkey(nome_exibicao, avatar_url)",
    )
    .eq("modalidade", "presencial")
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .in("cidade_uf", [...CIDADES_PRESENCIAIS])
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("[/presencial] erro ao buscar mesas:", error.message);
    return [];
  }

  // Mesa cheia no fim da lista: ela continua aparecendo (vale ver que a
  // cidade tem movimento), mas depois das que ainda aceitam gente.
  return lotadasPorUltimo((data ?? []) as unknown as MesaCardData[]);
}

export async function ListaDeMesasPresenciais({
  todasMesas,
  cidade,
  pagina,
}: {
  todasMesas: MesaCardData[];
  /** `null` na página geral; fixa na página de cidade. */
  cidade: CidadePresencial | null;
  pagina: string | undefined;
}) {
  const t = await getTranslations("Presencial");

  // A contagem por cidade sai do conjunto inteiro, não da fatia filtrada:
  // os chips precisam mostrar quanta mesa existe em cada cidade mesmo
  // enquanto você está olhando uma só.
  const contagem = todasMesas.reduce<Record<string, number>>((acc, m) => {
    if (m.cidade_uf) acc[m.cidade_uf] = (acc[m.cidade_uf] ?? 0) + 1;
    return acc;
  }, {});
  const cidadesComMesa = CIDADES_PRESENCIAIS.filter((c) => (contagem[c] ?? 0) > 0);

  const filtradas = cidade ? todasMesas.filter((m) => m.cidade_uf === cidade) : todasMesas;
  const { pagina: atual, totalPaginas, fatia: mesas } = fatiar(filtradas, pagina, POR_PAGINA);
  const situacoes = await minhasInscricoes(mesas.map((m) => m.id ?? ""));

  const caminho = cidade ? `/presencial/${SLUG_CIDADE[cidade]}` : "/presencial";

  return (
    <Container className="pb-16">
      <FiltroCidades contagem={contagem} selecionada={cidade} total={todasMesas.length} />

      {filtradas.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {cidade
            ? t("resumoCidade", { mesas: filtradas.length, cidade })
            : t("resumo", { mesas: todasMesas.length, cidades: cidadesComMesa.length })}
        </p>
      )}

      <div className="mt-6">
        {mesas.length === 0 ? (
          /* Vazio com a cidade no texto: dizer "nenhuma mesa publicada"
             enquanto existem mesas em outras cidades seria mentira. */
          <EstadoVazio
            icone={MapPin}
            titulo={cidade ? t("vazioCidadeTitulo", { cidade }) : t("vazioTitulo")}
            corpo={cidade ? t("vazioCidadeCorpo", { cidade }) : t("vazioCorpo")}
            acao={
              <div className="flex flex-wrap items-center justify-center gap-3">
                {cidade && (
                  <Link href="/presencial" className={buttonVariants({ variant: "marca" })}>
                    {t("verTodasCidades")}
                  </Link>
                )}
                {/* Leva pro grupo, então o rótulo precisa dizer isso. Antes
                    este botão dizia "Criar minha mesa presencial" e abria o
                    WhatsApp — prometia uma coisa e fazia outra. */}
                <a
                  href={SITE_LINKS.whatsappComunidade}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", className: "rounded-full" })}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  {t("vazioAvisarCta")}
                </a>
              </div>
            }
          />
        ) : (
          <>
            <GradeAdaptavel
              itens={mesas}
              chave={(m) => m.slug}
              variante="lista"
              render={(mesa) => (
                <MesaCard mesa={mesa} situacao={mesa.id ? situacoes.get(mesa.id) : undefined} />
              )}
            />
            <Paginacao caminho={caminho} pagina={atual} totalPaginas={totalPaginas} />
          </>
        )}
      </div>
    </Container>
  );
}

/**
 * "Sua cidade não está na lista?" — a porta de entrada das regiões que o site
 * ainda não atende.
 *
 * Existe porque a lista de cidades é fechada e cresce devagar: sem isso, quem
 * mora fora dessas cinco chega na página, não acha nada e vai embora sem
 * deixar rastro. A comunidade tem moderador por região, e é com ele que uma
 * cidade nova começa — então o caminho é o grupo, não um formulário.
 */
export async function OutraCidade() {
  const t = await getTranslations("Presencial");

  return (
    <section className="border-t border-border/60 py-14">
      <Container>
        <div className="rounded-2xl painel p-6 sm:p-8">
          <h2 className="titulo-display titulo-bloco">{t("outraCidadeTitulo")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("outraCidadeCorpo")}</p>
          <a
            href={SITE_LINKS.whatsappComunidade}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "marca", className: "mt-5" })}
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("outraCidadeCta")}
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("cidadesAtendidas", { cidades: listaDeCidades() })}
          </p>
        </div>
      </Container>
    </section>
  );
}

/** Os três passos de quem vai publicar uma mesa. */
export async function ComoPublicar() {
  const t = await getTranslations("Presencial");

  return (
    <section className="relative border-t border-border/60 py-16">
      <Container>
        <h2 className="titulo-display titulo-secao">{t("comoFuncionaTitulo")}</h2>
        <ol className="cascata mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="rounded-2xl painel p-5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 font-heading font-bold tabular-nums text-primary">
                {n}
              </span>
              <h3 className="titulo-display titulo-bloco mt-4">{t(`passo${n}Titulo`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(`passo${n}Corpo`)}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/mesas/nova?modalidade=presencial"
          className={buttonVariants({ variant: "marca", size: "lg", className: "mt-7" })}
        >
          {t("criarMesa")}
        </Link>
      </Container>
    </section>
  );
}
