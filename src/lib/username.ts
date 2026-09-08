/**
 * Normaliza o que o usuário digita no campo de username em tempo real, pra
 * nunca deixar chegar no servidor algo que o regex `/^[a-z0-9_-]{3,30}$/`
 * vai rejeitar. Sem isso, alguém digitando o próprio nome ("João Silva")
 * levava um erro genérico só depois de enviar o formulário inteiro — sem
 * indicação clara de que o problema era esse campo, não a senha ou outro.
 */
export function sanitizarUsername(valor: string): string {
  const semAcentos = valor.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return semAcentos
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}
