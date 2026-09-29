import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { acessoAoPainel, membrosDaMesa } from "@/lib/painel/acesso";
import { listarEntidades } from "@/lib/painel/dados";
import { Elenco } from "./elenco";

export default async function ElencoPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const acesso = await acessoAoPainel(slug);
  if (!acesso) notFound();

  // O RLS já devolve só o que esta pessoa pode ver — a tela não filtra nada.
  const entidades = await listarEntidades(acesso.mesa.id);
  // A lista de membros só serve pro seletor de "revelar pra jogadores específicos".
  const membros = acesso.ehMestre ? await membrosDaMesa(acesso.mesa.id) : [];

  return <Elenco slug={slug} entidades={entidades} membros={membros} ehMestre={acesso.ehMestre} />;
}
