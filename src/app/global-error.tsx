"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#0B0B14",
          color: "#F5F5FA",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Algo deu errado</h1>
        <p style={{ color: "#A0A0B8", margin: 0, maxWidth: "24rem" }}>
          Não deu pra carregar o site agora. Tenta de novo em instantes.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            borderRadius: "9999px",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg,#4F7DF3,#A855F7)",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
