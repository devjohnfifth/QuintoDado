import type { Metadata } from "next";
import { RedefinirSenhaGate } from "./redefinir-senha-gate";

export const metadata: Metadata = { title: "Redefinir senha — Quinto Dado", robots: { index: false } };

export default function RedefinirSenhaPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-2xl font-bold">Escolha uma nova senha</h1>
      <RedefinirSenhaGate />
    </div>
  );
}
