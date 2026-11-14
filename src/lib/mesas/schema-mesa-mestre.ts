import { z } from "zod";
import { ehCidadePresencial } from "./cidades";
import { hojeNoBrasil } from "./horario";

/**
 * Validação da mesa que o próprio mestre cria — online ou presencial.
 *
 * Mora aqui, e não dentro da Server Action, porque é regra que mexe em
 * dinheiro (o valor da mesa) e o CLAUDE.md exige teste automatizado pra isso.
 * Arquivo com "use server" só exporta função async, então o schema não poderia
 * ser importado por um teste se continuasse lá.
 *
 * O que esta validação NÃO faz: decidir se o site cobra a mesa. Isso é fixo em
 * `cobranca_gerenciada_pelo_site: false` na action e, principalmente, na policy
 * `mesa_cria` do banco — o valor aqui é sempre informativo.
 */
export const schemaMesaDoMestre = z
  .object({
    titulo: z.string().trim().min(3, "Título muito curto.").max(120),
    modalidade: z.enum(["online", "presencial"]),
    tipo: z.enum(["one_shot", "aventura", "campanha"]),
    sistemaId: z.string().uuid("Escolha um sistema."),
    sistemaOutroNome: z.string().trim().max(60).optional(),
    sinopse: z.string().trim().min(10, "Conte um pouco mais sobre a mesa.").max(20000),
    // Só vale pra presencial; validada no refine lá embaixo, porque mesa
    // online não tem cidade nenhuma.
    cidadeUf: z.string().trim().optional(),
    // Só valem pra online. Opcionais: muita mesa combina a ferramenta depois,
    // e o admin ainda modera antes de publicar.
    plataformaVtt: z.string().trim().max(60).optional(),
    plataformaVoz: z.string().trim().max(60).optional(),
    dataInicio: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida."),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
    vagasTotal: z.coerce.number().int().min(1).max(12),
    minJogadores: z.coerce.number().int().min(1),
    classificacao: z.enum(["livre", "14", "16", "18"]),
    nivelExperiencia: z.enum(["iniciante", "intermediario", "avancado", "todos"]),
    gratuita: z.coerce.boolean(),
    valorReais: z.coerce.number().min(0).max(999).optional(),
    bannerUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.minJogadores <= d.vagasTotal, {
    message: "O mínimo de jogadores não pode passar do total de vagas.",
    path: ["minJogadores"],
  })
  .refine((d) => d.dataInicio >= hojeNoBrasil(), {
    message: "A data de início não pode ser no passado.",
    path: ["dataInicio"],
  })
  // Lista fechada no servidor também: o formulário é só a primeira barreira, e
  // mesa presencial fora dessas cidades não apareceria na listagem de
  // /presencial. A constraint `presencial_exige_local` do banco é a terceira.
  .refine((d) => d.modalidade !== "presencial" || ehCidadePresencial(d.cidadeUf ?? ""), {
    message: "Escolha uma das cidades disponíveis.",
    path: ["cidadeUf"],
  });

export type MesaDoMestreInput = z.infer<typeof schemaMesaDoMestre>;

/**
 * Converte o valor em reais do formulário para centavos.
 *
 * Dinheiro é inteiro em centavos (regra 1 do CLAUDE.md). Gratuita é 0; abaixo
 * de R$5,00 não existe, porque o banco recusa (`preco_centavos = 0 or >= 500`)
 * e um erro de constraint não explicaria nada pro mestre.
 */
export function precoEmCentavos(
  dados: Pick<MesaDoMestreInput, "gratuita" | "valorReais">,
): { ok: true; centavos: number } | { ok: false; error: string } {
  if (dados.gratuita) return { ok: true, centavos: 0 };

  const centavos = Math.round((dados.valorReais ?? 0) * 100);
  if (centavos > 0 && centavos < 500) {
    return {
      ok: false,
      error: "O valor sugerido precisa ser R$5,00 ou mais (ou marque como gratuita).",
    };
  }
  return { ok: true, centavos };
}
