import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Dices } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Reveal } from "@/components/site/reveal";
import { MesaCard, type MesaCardData } from "@/components/site/mesa-card";
import { Container } from "@/components/site/container";
import { PageHeader } from "@/components/site/page-header";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { GradeAdaptavel } from "@/components/site/grade-adaptavel";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "RPG de mesa: mesas abertas — Quinto Dado";
  const description =
    "Encontre uma mesa de RPG de mesa aberta com o Mestre Quintão: one-shots online e presenciais. Vagas limitadas, linhas e véus combinados antes de começar.";
  return {
    title,
    description,
    alternates: { canonical: "/mesas" },
    openGraph: { title, description, locale, type: "website" },
  };
}

type Filtros = { sistema?: string; modalidade?: string; preco?: string };

async function buscarSistemasFavoritos(): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("sistemas_favoritos")
    .eq("id", user.id)
    .maybeSingle();
  return new Set(perfil?.sistemas_favoritos ?? []);
}

async function buscarMesas(filtros: Filtros, favoritos: Set<string>): Promise<MesaCardData[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[/mesas] Supabase não configurado — mostrando estado vazio (ver .env.example).");
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("mesas")
    .select(
      "sistema_id, slug, titulo, modalidade, cidade_uf, classificacao, nivel_experiencia, preco_centavos, frequencia, data_inicio, horario_inicio, horario_fim, vagas_total, min_jogadores, banner_url, sistemas(nome, slug), sistema_outro, vagas_preenchidas, jogadores_aprovados, eventos(titulo)",
    )
    .in("status", ["publicada", "confirmada", "em_andamento"])
    .order("data_inicio", { ascending: true });

  if (filtros.sistema) query = query.eq("sistemas.slug", filtros.sistema);
  if (filtros.modalidade === "online" || filtros.modalidade === "presencial") {
    query = query.eq("modalidade", filtros.modalidade);
  }
  if (filtros.preco === "gratis") query = query.eq("preco_centavos", 0);
  if (filtros.preco === "pago") query = query.gt("preco_centavos", 0);

  const { data, error } = await query;

  if (error) {
    console.error("[/mesas] erro ao buscar mesas:", error.message);
    return [];
  }

  // O filtro por sistemas.slug acima é um inner-join implícito do PostgREST
  // só quando a FK é obrigatória; como sistema_id aceita null (mesa "outro"),
  // filtra de novo em memória pra garantir que só sobra o sistema escolhido.
  const filtradas = (
    filtros.sistema
      ? (data ?? []).filter((m) => (m as unknown as MesaCardData).sistemas?.slug === filtros.sistema)
      : (data ?? [])
  ) as unknown as MesaCardData[];

  // Mesas dos sistemas favoritos do usuário logado sobem pro topo — a data
  // continua sendo o critério de ordem dentro de cada grupo (favorita ou
  // não), já que .sort() é estável.
  if (favoritos.size > 0) {
    filtradas.sort((a, b) => {
      const aFav = a.sistema_id && favoritos.has(a.sistema_id) ? 0 : 1;
      const bFav = b.sistema_id && favoritos.has(b.sistema_id) ? 0 : 1;
      return aFav - bFav;
    });
  }

  return filtradas;
}

async function buscarSistemasComMesaAberta(): Promise<{ nome: string; slug: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("mesas")
    .select("sistemas(nome, slug)")
    .in("status", ["publicada", "confirmada", "em_andamento"]);

  const vistos = new Map<string, { nome: string; slug: string }>();
  for (const linha of data ?? []) {
    const sistema = (linha as unknown as { sistemas: { nome: string; slug: string } | null }).sistemas;
    if (sistema && !vistos.has(sistema.slug)) vistos.set(sistema.slug, sistema);
  }
  return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

async function ehAdmin() {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: perfil } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  return perfil?.papel === "admin";
}

export default async function MesasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Filtros>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const filtros = await searchParams;
  const t = await getTranslations("Mesas");
  const sistemasFavoritos = await buscarSistemasFavoritos();
  const [mesas, admin, sistemas] = await Promise.all([
    buscarMesas(filtros, sistemasFavoritos),
    ehAdmin(),
    buscarSistemasComMesaAberta(),
  ]);
  const temFiltroAtivo = Boolean(filtros.sistema || filtros.modalidade || filtros.preco);

  return (
    <Container className="py-16">
      <PageHeader
        icone={Dices}
        titulo={t("titulo")}
        subtitulo={t("subtitulo")}
        acoes={
          admin && (
            <Link href="/admin/mesas/nova" className={buttonVariants({ variant: "marca" })}>
              {t("novaMesa")}
            </Link>
          )
        }
      />

      <Reveal className="mt-8">
        <form className="flex flex-wrap gap-3" aria-label={t("filtros.label")}>
          <select
            name="sistema"
            defaultValue={filtros.sistema ?? ""}
            className="h-10 rounded-full border border-border bg-card/60 px-4 text-sm"
          >
            <option value="">{t("filtros.todosSistemas")}</option>
            {sistemas.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nome}
              </option>
            ))}
          </select>
          <select
            name="modalidade"
            defaultValue={filtros.modalidade ?? ""}
            className="h-10 rounded-full border border-border bg-card/60 px-4 text-sm"
          >
            <option value="">{t("filtros.todasModalidades")}</option>
            <option value="online">{t("filtros.online")}</option>
            <option value="presencial">{t("filtros.presencial")}</option>
          </select>
          <select
            name="preco"
            defaultValue={filtros.preco ?? ""}
            className="h-10 rounded-full border border-border bg-card/60 px-4 text-sm"
          >
            <option value="">{t("filtros.qualquerPreco")}</option>
            <option value="gratis">{t("filtros.gratuitas")}</option>
            <option value="pago">{t("filtros.pagas")}</option>
          </select>
          <button type="submit" className={buttonVariants({ variant: "marca" })}>
            {t("filtros.filtrar")}
          </button>
          {temFiltroAtivo && (
            <Link href="/mesas" className={buttonVariants({ variant: "ghost", className: "rounded-full" })}>
              {t("filtros.limpar")}
            </Link>
          )}
        </form>
      </Reveal>

      <Reveal className="mt-6">
        {mesas.length === 0 ? (
          <EstadoVazio
            icone={Dices}
            titulo={temFiltroAtivo ? t("filtros.semResultadoTitulo") : t("vazioTitulo")}
            corpo={temFiltroAtivo ? t("filtros.semResultadoCorpo") : t("vazioCorpo")}
          />
        ) : (
          <GradeAdaptavel
            itens={mesas}
            chave={(m) => m.slug}
            render={(mesa, destaque) => (
              <MesaCard
                mesa={mesa}
                destaque={destaque}
                favorito={Boolean(mesa.sistema_id && sistemasFavoritos.has(mesa.sistema_id))}
              />
            )}
          />
        )}
      </Reveal>
    </Container>
  );
}
