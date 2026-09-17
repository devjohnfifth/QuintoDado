import Image from "next/image";
import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";

type Jogador = { nome: string; avatar_url: string | null };

/** Mais que isso vira "+N" — mesa grande não pode estourar o card. */
const MAX_CADEIRAS = 10;

const TAMANHOS = {
  sm: { lugar: "w-7", avatar: "size-6 text-[0.625rem]", cadeira: "h-7 w-6", icone: "size-3.5" },
  md: { lugar: "w-10", avatar: "size-8 text-xs", cadeira: "h-9 w-8", icone: "size-4" },
} as const;

/** Cadeira de taverna vista de frente: encosto, assento e duas pernas. */
function Cadeira({ ocupada, className }: { ocupada: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 24 28"
      aria-hidden
      className={`${className} ${ocupada ? "text-primary" : "text-muted-foreground/50"}`}
    >
      <rect
        x="5"
        y="1"
        width="14"
        height="13"
        rx="3"
        fill={ocupada ? "currentColor" : "none"}
        fillOpacity={ocupada ? 0.35 : undefined}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="14"
        width="18"
        height="4.5"
        rx="1.5"
        fill={ocupada ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M6 18.5V27M18 18.5V27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Vagas da mesa como uma fileira de cadeiras: cada vaga preenchida vira uma
 * cadeira colorida com o avatar de quem sentou; as livres ficam só no
 * contorno. Se houver mais vagas preenchidas que jogadores com perfil
 * público, a cadeira fica colorida com um avatar genérico.
 */
export function CadeirasVagas({
  total,
  preenchidas,
  jogadores,
  tamanho = "sm",
}: {
  total: number;
  preenchidas: number;
  jogadores: Jogador[];
  tamanho?: keyof typeof TAMANHOS;
}) {
  const t = useTranslations("MesaCard");
  const tam = TAMANHOS[tamanho];
  const visiveis = Math.min(total, MAX_CADEIRAS);
  const extras = total - visiveis;

  return (
    <ul
      className="flex flex-wrap items-end gap-1"
      aria-label={t("vagasAria", { preenchidas, total })}
    >
      {Array.from({ length: visiveis }, (_, i) => {
        const ocupada = i < preenchidas;
        const jogador = ocupada ? jogadores[i] : undefined;
        return (
          <li
            key={i}
            title={ocupada ? (jogador?.nome ?? t("vagaOcupada")) : t("vagaLivre")}
            className={`flex flex-col items-center ${tam.lugar}`}
          >
            {/* Espaço do avatar existe mesmo na vaga livre, pra todas as cadeiras alinharem embaixo. */}
            <span
              className={`relative z-10 -mb-2.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${tam.avatar} ${
                ocupada ? "bg-marca text-white ring-2 ring-card" : "invisible"
              }`}
            >
              {jogador?.avatar_url ? (
                <Image src={jogador.avatar_url} alt="" fill sizes="32px" className="object-cover" />
              ) : jogador ? (
                jogador.nome.charAt(0).toUpperCase()
              ) : (
                ocupada && <UserRound className={tam.icone} aria-hidden />
              )}
            </span>
            <Cadeira ocupada={ocupada} className={tam.cadeira} />
          </li>
        );
      })}
      {extras > 0 && (
        <li className="self-center pl-1 text-xs font-medium text-muted-foreground">+{extras}</li>
      )}
    </ul>
  );
}
