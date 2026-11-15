import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RedefinirSenhaGate } from "./redefinir-senha-gate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Entrar");
  return { title: t("redefinirMetaTitulo"), robots: { index: false } };
}

export default function RedefinirSenhaPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-2xl font-bold">Escolha uma nova senha</h1>
      <RedefinirSenhaGate />
    </div>
  );
}
