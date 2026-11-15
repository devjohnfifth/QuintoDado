import "server-only";

/**
 * Leitura dos dados pessoais do próprio usuário.
 *
 * `profiles.data_nascimento`, `nome_completo` e `telefone` não são legíveis
 * pelas chaves pública e autenticada (migration 20261115210000): a tabela
 * precisa ser lida publicamente pra mostrar nome de exibição e avatar, e o
 * grant de tabela inteira arrastava junto o dado pessoal de todo mundo.
 *
 * Quem precisa desses campos passa por aqui. As funções do banco são
 * `security definer` e olham só `auth.uid()`, então não existe forma de pedir
 * o dado de outra pessoa — nem de propósito, nem por engano. O admin, que
 * precisa ver dado de terceiros, usa `serviceRole()` com checagem explícita.
 */

/** O mínimo do cliente Supabase que estas funções usam. */
type ComRpc = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export type DadosPessoais = {
  nome_completo: string | null;
  telefone: string | null;
  data_nascimento: string;
};

/**
 * Idade em anos completos de quem está logado, ou `null` se não deu pra
 * saber. Quem chama trata `null` como "não confirmada" e falha fechado — o
 * gating etário nunca pode passar por falta de informação.
 */
export async function minhaIdade(supabase: ComRpc): Promise<number | null> {
  const { data, error } = await supabase.rpc("minha_idade");
  if (error) {
    console.error("[minhaIdade] erro:", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

/** Nome civil, telefone e data de nascimento de quem está logado. */
export async function meusDadosPessoais(supabase: ComRpc): Promise<DadosPessoais | null> {
  const { data, error } = await supabase.rpc("meus_dados_pessoais");
  if (error) {
    console.error("[meusDadosPessoais] erro:", error.message);
    return null;
  }
  // A função devolve `setof`, então o PostgREST entrega uma lista.
  const linha = Array.isArray(data) ? data[0] : data;
  return (linha as DadosPessoais | undefined) ?? null;
}
