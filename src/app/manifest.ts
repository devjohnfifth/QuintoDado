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
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
