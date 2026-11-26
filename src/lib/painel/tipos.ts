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

/** Do mais fechado pro mais aberto — a ordem é a do seletor na tela. */
export const VISIBILIDADES = ["oculto", "especificos", "jogadores", "mesa"] as const;
export type Visibilidade = (typeof VISIBILIDADES)[number];

/**
 * Convenção visual fixa do painel, aprendida uma vez e válida em campo,
 * relacionamento e entidade. Fecha → abre:
 * vermelho tracejado = só o mestre · azul = alguns jogadores ·
 * âmbar = quem joga na mesa · verde = quem tem conta no site.
 */
export const CLASSE_VISIBILIDADE: Record<Visibilidade, string> = {
  oculto: "border border-dashed border-erro/60 text-erro",
  especificos: "border border-primary/50 text-primary",
  jogadores: "border border-alerta/50 text-alerta",
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
  /** Quem criou — jogador edita só o que é dele; o mestre mexe em tudo. */
  criado_por: string | null;
  profiles: { nome_exibicao: string } | null;
  tipo: TipoEntidade;
  nome: string;
  imagem_url: string | null;
  /** Só vem do banco pra quem mestra: pro jogador, entidade oculta não existe. */
  oculta: boolean;
  ordem: number;
  painel_campos: Campo[];
};
