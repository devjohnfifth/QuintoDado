/** O mínimo que uma lista precisa saber pra decidir se a mesa ainda tem lugar. */
type MesaComVagas = { vagas_total: number; vagas_preenchidas: number };

/**
 * Quantas cadeiras ainda sobram.
 *
 * Nunca negativo: `vagas_preenchidas` é uma função do banco que conta
 * inscrições aprovadas, e nada impede o mestre de aprovar mais gente do que
 * o total de vagas. Quando isso acontece a mesa está lotada, não "com -1
 * vagas".
 */
export function vagasLivres(mesa: MesaComVagas): number {
  return Math.max(0, mesa.vagas_total - mesa.vagas_preenchidas);
}

export function mesaLotada(mesa: MesaComVagas): boolean {
  return vagasLivres(mesa) === 0;
}

/**
 * Joga as mesas lotadas pro fim da lista, sem bagunçar o resto.
 *
 * Ordena no lugar e devolve o mesmo array. Como o `sort` do JS é estável,
 * qualquer ordem que a lista já tivesse (data, sistema favorito) continua
 * valendo dentro de cada grupo — e aplicar este por último faz dele o
 * critério mais forte.
 *
 * Por que lotada vai pro fim: quem abre a lista está procurando mesa pra
 * jogar. Mesa cheia não some (ver uma mesa boa lotada é o que faz a pessoa
 * voltar), mas não ocupa o lugar de uma em que dá pra entrar hoje.
 */
export function lotadasPorUltimo<T extends MesaComVagas>(mesas: T[]): T[] {
  return mesas.sort((a, b) => Number(mesaLotada(a)) - Number(mesaLotada(b)));
}
