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

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setEstado("pronto");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setEstado("pronto");
      }
    });

    const tempoLimite = setTimeout(() => {
      setEstado((atual) => (atual === "verificando" ? "invalido" : atual));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(tempoLimite);
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
