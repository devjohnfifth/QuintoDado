/**
 * Tipos e rótulos do painel da mesa. Os rótulos de enum ficam aqui, no molde
 * de `src/lib/mesas/labels.ts`; texto de interface vive no `messages/pt-BR.json`.
 */

export const TIPOS_ENTIDADE = ["npc", "local", "item", "faccao", "personagem"] as const;
export type TipoEntidade = (typeof TIPOS_ENTIDADE)[number];

export const TIPO_ENTIDADE_LABEL: Record<TipoEntidade, { singular: string; plural: string }> = {
  npc: { singular: "NPC", plural: "NPCs" },
  local: { singular: "Local", plural: "Locais" },
  item: { singular: "Item", plural: "Itens" },
  faccao: { singular: "Facção", plural: "Facções" },
  personagem: { singular: "Personagem", plural: "Personagens" },
};

export const VISIBILIDADES = ["oculto", "mesa", "especificos"] as const;
export type Visibilidade = (typeof VISIBILIDADES)[number];

/**
 * Convenção visual fixa do painel, aprendida uma vez e válida em campo,
 * relacionamento e entidade:
 * vermelho tracejado = só o mestre vê · azul = revelado a alguns · verde = a mesa toda vê.
 */
export const CLASSE_VISIBILIDADE: Record<Visibilidade, string> = {
  oculto: "border border-dashed border-erro/60 text-erro",
  especificos: "border border-primary/50 text-primary",
  mesa: "border border-sucesso/50 text-sucesso",
};

export type Campo = {
  id: string;
  rotulo: string;
  valor: string | null;
  ordem: number;
  vis: Visibilidade;
  revelado_para: string[];
};

export type Entidade = {
  id: string;
  tipo: TipoEntidade;
  nome: string;
  imagem_url: string | null;
  /** Só vem do banco pra quem mestra: pro jogador, entidade oculta não existe. */
  oculta: boolean;
  ordem: number;
  painel_campos: Campo[];
};
