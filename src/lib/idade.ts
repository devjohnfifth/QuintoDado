export function idadeEmAnos(dataISO: string): number {
  const nascimento = new Date(dataISO);
  if (Number.isNaN(nascimento.getTime())) return -1;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}
