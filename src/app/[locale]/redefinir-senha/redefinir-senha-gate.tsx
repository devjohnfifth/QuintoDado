"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

type Estado = "verificando" | "pronto" | "invalido";

export function RedefinirSenhaGate() {
  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    const supabase = createClient();
    // Cada chamada de processarLink() ganha um número. Uma resposta assíncrona
    // só pode atualizar a tela se ainda for a chamada mais recente — assim,
    // se dois links forem processados em sequência rápida, o que resolver
    // por último não corre o risco de ser sobrescrito por uma resposta mais
    // lenta de uma tentativa anterior já obsoleta.
    let geracaoAtual = 0;

    // O e-mail de recuperação do Supabase sempre manda um link no formato
    // implícito (tokens no hash da URL, nunca chegam ao servidor). Mas o
    // createBrowserClient do @supabase/ssr trava flowType em "pkce" — e o
    // detector automático do SDK (o que dispararia PASSWORD_RECOVERY sozinho)
    // rejeita qualquer callback implícito nesse modo e falha em silêncio,
    // sem nunca emitir o evento. Por isso lemos os tokens do hash na mão e
    // chamamos setSession() diretamente, sem depender da detecção automática.
    function processarLink() {
      const minhaGeracao = ++geracaoAtual;
      setEstado("verificando");

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const erroNoHash = hashParams.get("error_description");
      const queryCode = new URLSearchParams(window.location.search).get("code");

      if (erroNoHash) {
        setEstado("invalido");
        return;
      }

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
          if (minhaGeracao !== geracaoAtual) return;
          window.history.replaceState(null, "", window.location.pathname);
          setEstado(error ? "invalido" : "pronto");
        });
        return;
      }

      if (queryCode) {
        supabase.auth.exchangeCodeForSession(queryCode).then(({ error }) => {
          if (minhaGeracao !== geracaoAtual) return;
          window.history.replaceState(null, "", window.location.pathname);
          setEstado(error ? "invalido" : "pronto");
        });
        return;
      }

      // Sem link de recuperação na URL — só deixa passar se já houver sessão
      // (ex.: usuário voltou pra essa página com a troca ainda em andamento).
      supabase.auth.getSession().then(({ data }) => {
        if (minhaGeracao !== geracaoAtual) return;
        setEstado(data.session ? "pronto" : "invalido");
      });
    }

    processarLink();

    // Colar um link novo na mesma aba (só o hash muda) não recarrega a
    // página — o React nunca desmonta esse componente, então sem isso a
    // tela ficava travada mostrando "inválido" da tentativa anterior pra
    // sempre, mesmo que o link novo fosse perfeitamente válido.
    window.addEventListener("hashchange", processarLink);
    return () => {
      geracaoAtual++; // invalida qualquer resposta pendente após desmontar
      window.removeEventListener("hashchange", processarLink);
    };
  }, []);

  if (estado === "verificando") {
    return <p className="mt-8 text-center text-sm text-muted-foreground">Verificando o link...</p>;
  }

  if (estado === "invalido") {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        Esse link de recuperação é inválido ou expirou.{" "}
        <Link href="/entrar" className="text-primary hover:underline">
          Peça um novo
        </Link>
        .
      </p>
    );
  }

  return <RedefinirSenhaForm />;
}
