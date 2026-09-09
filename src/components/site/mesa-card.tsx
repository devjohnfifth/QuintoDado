import Image from "next/image";
import { Users, Globe, MapPin, Repeat, Calendar, Clock, Flame, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import { MODALIDADE_LABEL, FREQUENCIA_LABEL } from "@/lib/mesas/labels";
import { diaSemanaAbreviado, diasParaComeco } from "@/lib/mesas/horario";
import { LOGO_SISTEMA } from "@/lib/mesas/logos-sistemas";

export type MesaCardData = {
  slug: string;
  titulo: string;
  modalidade: "online" | "presencial";
  cidade_uf: string | null;
  classificacao: string;
  nivel_experiencia: string;
  preco_centavos: number;
  frequencia: string;
  data_inicio: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_total: number;
  min_jogadores: number;
  vagas_preenchidas: number;
  banner_url: string | null;
  sistemas: { nome: string; slug: string } | null;
  jogadores_aprovados: { nome: string; avatar_url: string | null }[] | null;
};

export function MesaCard({ mesa }: { mesa: MesaCardData }) {
  const logo = mesa.sistemas ? LOGO_SISTEMA[mesa.sistemas.slug] : undefined;
  const dias = diasParaComeco(mesa.data_inicio);
  const faltam = mesa.min_jogadores - mesa.vagas_preenchidas;
  const jogadores = mesa.jogadores_aprovados ?? [];
  const jogadoresVisiveis = jogadores.slice(0, 4);
  const extras = jogadores.length - jogadoresVisiveis.length;

  return (
    <Link href={`/mesas/${mesa.slug}`} className="group relative flex items-stretch">
      {/* Talão — peça própria, forma e cor nunca mudam. O recorte acontece
          neste wrapper SEM borda própria: overflow-hidden clipa filhos na
          padding-box, que fica por dentro da borda — se a borda estivesse
          aqui, sobraria 1px dela sempre visível, por fora da área clipada.
          Por isso a borda mora só no filho de dentro. */}
      <div className="relative flex-1 overflow-hidden rounded-l-2xl">
        <span className="absolute -right-3 -top-3 z-10 size-6 rounded-full bg-background" />
        <span className="absolute -bottom-3 -right-3 z-10 size-6 rounded-full bg-background" />
        <div className="flex h-full flex-col rounded-l-2xl border-y border-l border-border bg-card/60 p-4 transition-colors duration-300 group-hover:border-primary/40 sm:p-5">
          {logo && (
            <div className="relative h-9 w-24 shrink-0 overflow-hidden rounded-md bg-white shadow-sm">
              <Image src={logo} alt={mesa.sistemas?.nome ?? ""} fill className="object-cover" sizes="96px" />
            </div>
          )}

          <h3 className="mt-3 font-heading text-base font-bold leading-tight sm:text-lg">
            {mesa.titulo}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {mesa.sistemas?.nome ?? "—"}
          </p>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground sm:text-sm">
            <p className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="text-foreground/90">
                {mesa.vagas_preenchidas}/{mesa.vagas_total}
              </span>{" "}
              vagas preenchidas
            </p>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                {mesa.modalidade === "online" ? (
                  <Globe className="size-3.5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
                )}
                {MODALIDADE_LABEL[mesa.modalidade]}
                {mesa.modalidade === "presencial" && mesa.cidade_uf ? ` · ${mesa.cidade_uf}` : ""}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {mesa.preco_centavos === 0 ? "Gratuita" : formatBRL(mesa.preco_centavos)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Repeat className="size-3.5 shrink-0 text-primary" aria-hidden />
                {FREQUENCIA_LABEL[mesa.frequencia] ?? mesa.frequencia}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {diaSemanaAbreviado(mesa.data_inicio)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0 text-primary" aria-hidden />
                {new Date(`${mesa.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-primary" aria-hidden />
                {mesa.horario_inicio.slice(0, 5)}–{mesa.horario_fim.slice(0, 5)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Costura — fica parada, marca onde o talão se destacaria. A linha
          pontilhada só corre entre as duas mordidas, nunca por cima delas —
          por isso fica inset pelo raio do furo (size-6 = 24px, raio 12px),
          em vez de esticar a costura inteira. Os furos ficam só no canhoto
          (abaixo), pra não duplicar o círculo aqui parado e lá se movendo
          junto no hover. */}
      <div aria-hidden className="relative w-0 shrink-0">
        <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-border/70" />
      </div>

      {/* Canhoto destacável — peça própria e completa, forma nunca muda, só a posição no hover.
          Mesma lógica do talão: quem recorta (overflow-hidden) não tem borda própria, então
          o furo cobre a borda de verdade, na mordida inteira — parada ou junto no hover. */}
      <div className="relative w-[27%] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:z-10 group-hover:translate-x-3 group-hover:rotate-2 sm:w-[30%]">
        <div className="relative size-full overflow-hidden rounded-r-2xl">
        <span className="absolute -left-3 -top-3 z-10 size-6 rounded-full bg-background" />
        <span className="absolute -bottom-3 -left-3 z-10 size-6 rounded-full bg-background" />
        <div className="relative size-full overflow-hidden rounded-r-2xl border-y border-r border-border bg-card transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-primary/40 group-hover:shadow-2xl">
        {mesa.banner_url ? (
          <Image
            src={mesa.banner_url}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 640px) 15vw, 27vw"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[#4F7DF3]/40 to-[#A855F7]/40"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='69' viewBox='0 0 80 92'%3E%3Cpath d='M40 0 L80 23 V69 L40 92 L0 69 V23 Z' fill='none' stroke='%23F5F5FA' stroke-width='1.5' opacity='0.15'/%3E%3C/svg%3E\")",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

        <div className="absolute inset-x-1.5 top-1.5 flex flex-wrap gap-1 sm:inset-x-2 sm:top-2">
          {dias >= 0 && dias <= 14 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
              <Flame className="size-2.5 shrink-0" aria-hidden />
              {dias === 0 ? "Hoje" : `${dias}d`}
            </span>
          )}
          {faltam > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
              <UserPlus className="size-2.5 shrink-0" aria-hidden />
              Falta {faltam}
            </span>
          )}
        </div>

        <p className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 text-center font-heading text-xs font-bold uppercase leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:inset-x-2">
          {mesa.titulo}
        </p>

        {jogadoresVisiveis.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center -space-x-1.5 sm:bottom-2 sm:left-2">
            {jogadoresVisiveis.map((j, i) =>
              j.avatar_url ? (
                <Image
                  key={i}
                  src={j.avatar_url}
                  alt={j.nome}
                  width={33}
                  height={33}
                  className="size-[30px] rounded-full border-2 border-background object-cover sm:size-9"
                />
              ) : (
                <span
                  key={i}
                  className="flex size-[30px] items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#4F7DF3] to-[#A855F7] text-xs font-bold text-white sm:size-9"
                >
                  {j.nome.charAt(0).toUpperCase()}
                </span>
              ),
            )}
            {extras > 0 && (
              <span className="flex size-[30px] items-center justify-center rounded-full border-2 border-background bg-black/60 text-xs font-bold text-white sm:size-9">
                +{extras}
              </span>
            )}
          </div>
        )}
        </div>
        </div>
      </div>
    </Link>
  );
}
