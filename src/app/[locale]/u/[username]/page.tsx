import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Dices } from "lucide-react";
import { Link } from "@/i18n/navigation";
import bannerOg from "@/assets/brand/banner-og.webp";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { D20MarcaDagua } from "@/components/site/d20-marca-dagua";
import { Selo } from "@/components/site/selo";
import { MesaCard } from "@/components/site/mesa-card";
import { BlocoFechamento } from "@/components/site/bloco-fechamento";
import { EstadoVazio } from "@/components/site/estado-vazio";
import { jsonLdSeguro } from "@/lib/json-ld";
import { iniciais } from "@/lib/perfil/iniciais";
import { lotadasPorUltimo } from "@/lib/mesas/vagas";
import { buscarPerfilPublico, mesasDoMestre, nomesDeSistemas } from "@/lib/perfil/publico";

/**
 * Perfil público — §276 da especificação, que existia no banco e não tinha
 * página.
 *
 * É a página que um mestre cola no Instagram e a que responde a busca pelo
 * nome dele. Por isso ela é renderizada no servidor com metadata, Open Graph
 * e JSON-LD, como toda página pública do site.
 *
 * Perfil fechado (`perfil_publico = false`) nem chega aqui: a policy
 * `perfil_leitura_publica` não devolve a linha, a busca volta vazia e a
 * resposta é 404 — igual a um username que não existe. "Este perfil é
 * privado" já confirmaria que a pessoa tem conta no site.
 */

type Params = Promise<{ locale: string; username: string }>;

/**
 * Quem entra no índice do Google: só quem mestra mesa que está no ar.
 *
 * Perfil é página pública, mas uma conta recém-criada não é conteúdo — e
 * indexar todo mundo que se cadastra transforma o site num diretório de
 * pessoas, que não é o que ele é. Quem publicou mesa já se colocou em
 * público e ganha com a busca; o resto fica acessível por link e fora do
 * índice.
 */
function deveIndexar(mesasPublicadas: number) {
  return mesasPublicadas > 0;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, username } = await params;
  const perfil = await buscarPerfilPublico(username);
  if (!perfil) return { title: "Perfil não encontrado — Quinto Dado", robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Perfil" });
  const mesas = await mesasDoMestre(username);

  const title = t("metaTitulo", { nome: perfil.nomeExibicao });
  // A bio é o que a própria pessoa escreveu sobre si: é melhor descrição que
  // qualquer frase montada. Sem bio, cai numa que ainda diz algo de concreto.
  const description =
    perfil.bio ??
    (mesas.length > 0
      ? t("metaDescricaoComMesas", { nome: perfil.nomeExibicao, mesas: mesas.length })
      : t("metaDescricaoSemMesas", { nome: perfil.nomeExibicao }));

  const imagem = perfil.avatarUrl;

  return {
    title,
    description,
    alternates: { canonical: `/u/${username}` },
    robots: deveIndexar(mesas.length) ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      locale,
      type: "profile",
      images: imagem
        ? [{ url: imagem }]
        : [{ url: bannerOg.src, width: bannerOg.width, height: bannerOg.height }],
    },
  };
}

export default async function PerfilPublicoPage({ params }: { params: Params }) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const perfil = await buscarPerfilPublico(username);
  if (!perfil) notFound();

  const t = await getTranslations("Perfil");
  const [mesas, sistemas] = await Promise.all([
    mesasDoMestre(username),
    nomesDeSistemas(perfil.sistemasFavoritos),
  ]);
  const emCartaz = lotadasPorUltimo(mesas);

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pessoaLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: perfil.nomeExibicao,
    alternateName: `@${perfil.username}`,
    url: `${site}/u/${perfil.username}`,
    ...(perfil.bio ? { description: perfil.bio } : {}),
    ...(perfil.avatarUrl ? { image: perfil.avatarUrl } : {}),
    ...(mesas.length > 0 ? { jobTitle: t("mestre") } : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbInicio"), item: site },
      { "@type": "ListItem", position: 2, name: perfil.nomeExibicao, item: `${site}/u/${perfil.username}` },
    ],
  };

  const desde = perfil.criadoEm
    ? new Date(perfil.criadoEm).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(pessoaLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(breadcrumbLd) }} />

      {/* Capa na mesma linguagem das outras páginas: trama, silhueta do d20 e
          o nome em display. Sem foto de capa própria — o rosto aqui é o
          avatar, e uma imagem grande atrás dele competiria com ele. */}
      <section className="textura-grao relative isolate overflow-hidden border-b border-border/60">
        <div aria-hidden className="textura-hex absolute inset-0 -z-10 opacity-[0.05]" />
        <D20MarcaDagua className="absolute -right-16 -top-20 -z-10 size-[22rem] text-foreground/[0.05] sm:-right-10 sm:size-[26rem]" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-background to-transparent"
        />

        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border sm:size-28">
              {perfil.avatarUrl ? (
                <Image src={perfil.avatarUrl} alt="" fill className="object-cover" sizes="112px" priority />
              ) : (
                <div className="flex size-full items-center justify-center bg-marca font-heading text-3xl font-bold text-white">
                  {iniciais(perfil.nomeExibicao)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="titulo-display titulo-pagina">{perfil.nomeExibicao}</h1>
              <p className="mt-1 text-muted-foreground">@{perfil.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {mesas.length > 0 && <Selo tom="marca">{t("mestre")}</Selo>}
                {desde && <span className="text-sm text-muted-foreground">{t("desde", { quando: desde })}</span>}
              </div>
            </div>
          </div>

          {perfil.bio && <p className="mt-6 max-w-2xl text-lg text-foreground/80">{perfil.bio}</p>}

          {sistemas.length > 0 && (
            <div className="mt-5">
              <p className="rotulo-caps text-muted-foreground">{t("joga")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {sistemas.map((nome) => (
                  <li
                    key={nome}
                    className="rounded-full border border-border bg-card/60 px-3 py-1 text-sm text-muted-foreground"
                  >
                    {nome}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <h2 className="titulo-display titulo-secao">
          {t("mesasDe", { nome: perfil.nomeExibicao.split(/\s+/)[0] })}
        </h2>

        {emCartaz.length === 0 ? (
          <div className="mt-5">
            <EstadoVazio
              icone={Dices}
              titulo={t("semMesasTitulo")}
              corpo={t("semMesasCorpo", { nome: perfil.nomeExibicao.split(/\s+/)[0] })}
              acao={
                <Link
                  href="/mesas"
                  className={buttonVariants({ variant: "outline", className: "rounded-full" })}
                >
                  {t("verTodasAsMesas")}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="cascata mt-5 space-y-4">
            {emCartaz.map((mesa) => (
              <li key={mesa.id}>
                <MesaCard mesa={mesa} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      <BlocoFechamento caminhos={["mesas", "eventos", "suplementos"]} />
    </>
  );
}
