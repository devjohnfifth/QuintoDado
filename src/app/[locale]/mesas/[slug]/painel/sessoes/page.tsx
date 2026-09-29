import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { acessoAoPainel } from "@/lib/painel/acesso";
import { listarSessoes } from "@/lib/painel/dados";
import { Sessoes } from "./sessoes";

export default async function SessoesPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const acesso = await acessoAoPainel(slug);
  if (!acesso) notFound();

  // Sessão em rascunho só chega aqui pro mestre — quem filtra é o RLS.
  const sessoes = await listarSessoes(acesso.mesa.id);

  return <Sessoes slug={slug} sessoes={sessoes} ehMestre={acesso.ehMestre} />;
}
