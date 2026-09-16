/**
 * Regras das tabelas aleatórias, sem React nem Supabase — usadas pelo editor
 * do admin (validação), pela página pública (rolagem) e pelo PDF.
 *
 * Uma tabela é identificada por `chave`: no editor é uma chave gerada no
 * cliente (os ids do banco mudam a cada save), na página pública é o id.
 */

export const DADOS = ["d4", "d6", "d8", "d10", "d12", "d20", "d66", "d100"] as const;
export type Dado = (typeof DADOS)[number];

export type ItemTabela = {
  faixaMin: number;
  faixaMax: number;
  /** Um valor por coluna, na mesma ordem de `Tabela.colunas`. */
  valores: string[];
  /** Chave da tabela que esse resultado manda rolar em seguida, se houver. */
  aninhada: string | null;
};

export type Tabela = {
  chave: string;
  titulo: string;
  dado: Dado;
  colunas: string[];
  itens: ItemTabela[];
};

export type Rolagem = {
  tabelaChave: string;
  tabelaTitulo: string;
  valor: number;
  /** null só se a tabela estiver com buraco — o editor não deixa salvar assim. */
  item: ItemTabela | null;
  aninhadas: Rolagem[];
};

export const PROFUNDIDADE_MAXIMA = 5;

/** Número em [0, 1). Injetável pra dar pra testar a rolagem de forma determinística. */
export type FonteAleatoria = () => number;

export const aleatorioSeguro: FonteAleatoria = () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
};

function inteiroEntre(min: number, max: number, aleatorio: FonteAleatoria) {
  return min + Math.floor(aleatorio() * (max - min + 1));
}

/** Faces de um dado comum (tudo menos o d66): "d12" → 12. */
function facesDoDado(dado: Exclude<Dado, "d66">): number {
  return Number(dado.slice(1));
}

/**
 * Todos os resultados possíveis do dado, em ordem.
 * d66 são dois d6 lidos como dezena e unidade: 11–16, 21–26 … 61–66
 * (não existe 17, 20, 30 etc.).
 */
export function valoresDoDado(dado: Dado): number[] {
  if (dado !== "d66") return Array.from({ length: facesDoDado(dado) }, (_, i) => i + 1);
  const valores: number[] = [];
  for (let dezena = 1; dezena <= 6; dezena++) {
    for (let unidade = 1; unidade <= 6; unidade++) valores.push(dezena * 10 + unidade);
  }
  return valores;
}

export function rolarDado(dado: Dado, aleatorio: FonteAleatoria = aleatorioSeguro): number {
  if (dado !== "d66") return inteiroEntre(1, facesDoDado(dado), aleatorio);
  return inteiroEntre(1, 6, aleatorio) * 10 + inteiroEntre(1, 6, aleatorio);
}

export function acharItem(tabela: Pick<Tabela, "itens">, valor: number): ItemTabela | null {
  return tabela.itens.find((i) => valor >= i.faixaMin && valor <= i.faixaMax) ?? null;
}

export function formatarFaixa(item: Pick<ItemTabela, "faixaMin" | "faixaMax">): string {
  return item.faixaMin === item.faixaMax ? String(item.faixaMin) : `${item.faixaMin}–${item.faixaMax}`;
}

/**
 * Agrupa números seguidos pra mensagem de erro ficar legível: [1,2,3,7] → "1–3, 7".
 * Só junta vizinho numérico (não "vizinho no dado"): no d66, 16 e 21 viram
 * "16, 21" e não "16–21", que sugeriria 17–20.
 */
function compactar(numeros: number[]): string {
  const partes: string[] = [];
  let inicio = numeros[0];
  for (let i = 1; i <= numeros.length; i++) {
    if (numeros[i] !== numeros[i - 1] + 1) {
      const fim = numeros[i - 1];
      partes.push(inicio === fim ? String(inicio) : `${inicio}–${fim}`);
      inicio = numeros[i];
    }
  }
  return partes.join(", ");
}

/**
 * Toda rolagem tem que cair em exatamente um resultado: sem buraco e sem
 * sobreposição. Devolve a lista de problemas (vazia = ok).
 */
export function validarFaixas(dado: Dado, itens: Pick<ItemTabela, "faixaMin" | "faixaMax">[]): string[] {
  const erros: string[] = [];
  const validos = valoresDoDado(dado);
  const conjunto = new Set(validos);

  itens.forEach((item, i) => {
    const linha = `Linha ${i + 1}`;
    if (!Number.isInteger(item.faixaMin) || !Number.isInteger(item.faixaMax)) {
      erros.push(`${linha}: a faixa precisa ser número inteiro.`);
      return;
    }
    if (item.faixaMin > item.faixaMax) {
      erros.push(`${linha}: o início da faixa (${item.faixaMin}) é maior que o fim (${item.faixaMax}).`);
    }
    if (!conjunto.has(item.faixaMin) || !conjunto.has(item.faixaMax)) {
      erros.push(`${linha}: ${formatarFaixa(item)} não é um resultado possível num ${dado}.`);
    }
  });

  if (erros.length > 0) return erros;

  const faltando: number[] = [];
  const repetidos: number[] = [];
  for (const valor of validos) {
    const cobertura = itens.filter((i) => valor >= i.faixaMin && valor <= i.faixaMax).length;
    if (cobertura === 0) faltando.push(valor);
    if (cobertura > 1) repetidos.push(valor);
  }

  if (faltando.length > 0) erros.push(`Faltam resultados no ${dado}: ${compactar(faltando)}.`);
  if (repetidos.length > 0) erros.push(`Faixas sobrepostas em: ${compactar(repetidos)}.`);
  return erros;
}

export function validarTabela(tabela: Tabela): string[] {
  const erros: string[] = [];
  const nome = tabela.titulo.trim() || "Tabela sem título";

  if (!tabela.titulo.trim()) erros.push("Toda tabela precisa de um título.");
  if (tabela.colunas.length === 0) erros.push(`${nome}: precisa de pelo menos uma coluna.`);
  if (tabela.colunas.some((c) => !c.trim())) erros.push(`${nome}: tem coluna sem nome.`);
  if (tabela.itens.length === 0) erros.push(`${nome}: não tem nenhum resultado.`);

  tabela.itens.forEach((item, i) => {
    if (item.valores.length !== tabela.colunas.length) {
      erros.push(
        `${nome}, linha ${i + 1}: tem ${item.valores.length} valor(es) pra ${tabela.colunas.length} coluna(s).`,
      );
    }
  });

  if (tabela.itens.length > 0) {
    erros.push(...validarFaixas(tabela.dado, tabela.itens).map((e) => `${nome}: ${e}`));
  }
  return erros;
}

/** Arestas "tabela → tabelas que algum resultado dela manda rolar". */
function grafoAninhadas(tabelas: Tabela[]): Map<string, Set<string>> {
  const grafo = new Map<string, Set<string>>();
  for (const t of tabelas) {
    grafo.set(t.chave, new Set(t.itens.map((i) => i.aninhada).filter((a): a is string => Boolean(a))));
  }
  return grafo;
}

/**
 * Valida o conjunto de tabelas de um suplemento: cada tabela individualmente,
 * chaves únicas, referências aninhadas existentes e nenhum ciclo (A rola B que
 * rola A travaria o "rolar tudo").
 */
export function validarConjunto(tabelas: Tabela[]): string[] {
  const erros = tabelas.flatMap(validarTabela);

  const chaves = new Set<string>();
  for (const t of tabelas) {
    if (chaves.has(t.chave)) erros.push(`Chave de tabela repetida: ${t.chave}.`);
    chaves.add(t.chave);
  }

  for (const t of tabelas) {
    for (const item of t.itens) {
      if (item.aninhada && !chaves.has(item.aninhada)) {
        erros.push(`${t.titulo || "Tabela"}: um resultado aponta pra uma tabela que não existe mais.`);
      }
    }
  }

  const ciclo = acharCiclo(grafoAninhadas(tabelas));
  if (ciclo) {
    const titulo = new Map(tabelas.map((t) => [t.chave, t.titulo || "Tabela sem título"]));
    erros.push(`Tabelas aninhadas em ciclo: ${ciclo.map((c) => titulo.get(c)).join(" → ")}.`);
  }

  return erros;
}

/** Busca em profundidade; devolve o caminho do primeiro ciclo achado, fechando no nó repetido. */
function acharCiclo(grafo: Map<string, Set<string>>): string[] | null {
  const visitando = new Set<string>();
  const concluido = new Set<string>();

  function visitar(chave: string, caminho: string[]): string[] | null {
    if (concluido.has(chave)) return null;
    if (visitando.has(chave)) return [...caminho.slice(caminho.indexOf(chave)), chave];

    visitando.add(chave);
    for (const proxima of grafo.get(chave) ?? []) {
      if (!grafo.has(proxima)) continue;
      const ciclo = visitar(proxima, [...caminho, chave]);
      if (ciclo) return ciclo;
    }
    visitando.delete(chave);
    concluido.add(chave);
    return null;
  }

  for (const chave of grafo.keys()) {
    const ciclo = visitar(chave, []);
    if (ciclo) return ciclo;
  }
  return null;
}

/** Tabelas que nenhum resultado manda rolar — são as que o "rolar tudo" rola. */
export function tabelasRaiz(tabelas: Tabela[]): Tabela[] {
  const apontadas = new Set(tabelas.flatMap((t) => t.itens.map((i) => i.aninhada)).filter(Boolean));
  return tabelas.filter((t) => !apontadas.has(t.chave));
}

export function rolarTabela(
  tabelas: Tabela[],
  chave: string,
  aleatorio: FonteAleatoria = aleatorioSeguro,
  caminho: string[] = [],
): Rolagem | null {
  const tabela = tabelas.find((t) => t.chave === chave);
  // Ciclo e profundidade já são barrados no save; aqui é só rede de segurança
  // pra nunca travar a página com dado corrompido.
  if (!tabela || caminho.includes(chave) || caminho.length >= PROFUNDIDADE_MAXIMA) return null;

  const valor = rolarDado(tabela.dado, aleatorio);
  const item = acharItem(tabela, valor);
  const aninhada = item?.aninhada ? rolarTabela(tabelas, item.aninhada, aleatorio, [...caminho, chave]) : null;

  return {
    tabelaChave: tabela.chave,
    tabelaTitulo: tabela.titulo,
    valor,
    item,
    aninhadas: aninhada ? [aninhada] : [],
  };
}

export function rolarTudo(tabelas: Tabela[], aleatorio: FonteAleatoria = aleatorioSeguro): Rolagem[] {
  return tabelasRaiz(tabelas)
    .map((t) => rolarTabela(tabelas, t.chave, aleatorio))
    .filter((r): r is Rolagem => r !== null);
}

const LINHA_COM_FAIXA = /^(\d+)(?:\s*[-–—]\s*(\d+))?(?:\t|\s+)(.+)$/;

/**
 * Converte texto colado (de planilha ou digitado) em itens.
 *
 * - Com faixa: `1-4<TAB>Goblins<TAB>2d6` ou `1-4 Goblins` (uma coluna).
 * - Sem faixa: uma linha por resultado; se a quantidade de linhas divide o
 *   dado, as faixas são distribuídas em ordem (6 linhas num d66 viram 11–16,
 *   21–26…). Se não divide, pede as faixas.
 *
 * Misturar linhas com e sem faixa é recusado — é quase sempre engano.
 */
export function parseItensColados(
  texto: string,
  dado: Dado,
  quantidadeColunas: number,
): { itens: ItemTabela[]; erros: string[] } {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhas.length === 0) return { itens: [], erros: ["Nada pra colar."] };

  const lidas = linhas.map((linha) => {
    const m = linha.match(LINHA_COM_FAIXA);
    if (m) {
      const min = Number(m[1]);
      return { min, max: m[2] ? Number(m[2]) : min, valores: m[3].split("\t").map((v) => v.trim()) };
    }
    return { min: null, max: null, valores: linha.split("\t").map((v) => v.trim()) };
  });

  const comFaixa = lidas.filter((l) => l.min !== null).length;
  if (comFaixa > 0 && comFaixa < lidas.length) {
    return {
      itens: [],
      erros: ["Algumas linhas têm faixa e outras não. Coloque a faixa em todas ou em nenhuma."],
    };
  }

  const erros: string[] = [];
  lidas.forEach((l, i) => {
    if (l.valores.length > quantidadeColunas) {
      erros.push(`Linha ${i + 1}: tem ${l.valores.length} valores pra ${quantidadeColunas} coluna(s).`);
    }
  });
  if (erros.length > 0) return { itens: [], erros };

  const completar = (valores: string[]) =>
    [...valores, ...Array(quantidadeColunas - valores.length).fill("")] as string[];

  if (comFaixa === lidas.length) {
    return {
      itens: lidas.map((l) => ({
        faixaMin: l.min as number,
        faixaMax: l.max as number,
        valores: completar(l.valores),
        aninhada: null,
      })),
      erros: [],
    };
  }

  const valores = valoresDoDado(dado);
  if (valores.length % lidas.length !== 0) {
    return {
      itens: [],
      erros: [
        `${lidas.length} linha(s) não dividem o ${dado} (${valores.length} resultados) em partes iguais — coloque as faixas no começo de cada linha.`,
      ],
    };
  }

  const tamanho = valores.length / lidas.length;
  return {
    itens: lidas.map((l, i) => ({
      faixaMin: valores[i * tamanho],
      faixaMax: valores[i * tamanho + tamanho - 1],
      valores: completar(l.valores),
      aninhada: null,
    })),
    erros: [],
  };
}
