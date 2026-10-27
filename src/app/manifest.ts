import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quinto Dado — RPG de mesa",
    short_name: "Quinto Dado",
    description: "Mesas de RPG online e presenciais, e material autoral gratuito com o Mestre Quintão.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B14",
    theme_color: "#0B0B14",
    // Os ícones têm margem de sobra em volta da arte de propósito: o Google
    // recorta o favicon num círculo e o Android numa máscara, e sem essa
    // folga a moldura do d20 era cortada. Por isso também servem como
    // `maskable`, que exige a arte dentro de 80% do diâmetro.
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
