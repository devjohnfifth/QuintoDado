import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { UsuariosTable, type UsuarioLinha } from "./usuarios-table";

function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

export default async function AdminUsuariosPage() {
  /*
   * `data_nascimento` não é mais legível pelas chaves públicas (ver a
   * migration 20261115210000): ela vazava a data de nascimento de todo mundo
   * pra qualquer visitante. Esta tela precisa dela pra mostrar a idade, então
   * lê pelo service_role — e, como o service_role ignora RLS, a permissão é
   * conferida aqui no código, explicitamente, em vez de ficar só no layout.
   */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: eu } = await supabase.from("profiles").select("papel").eq("id", user.id).maybeSingle();
  if (eu?.papel !== "admin") notFound();

  const { data: perfis, error } = await serviceRole()
    .from("profiles")
    .select("id, username, nome_exibicao, data_nascimento, papel, mestre_solicitado_em, criado_em")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[/admin/usuarios] erro ao buscar perfis:", error.message);
  }

  const usuarios: UsuarioLinha[] = (perfis ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    nomeExibicao: p.nome_exibicao,
    idade: calcularIdade(p.data_nascimento),
    papel: p.papel,
    mestreSolicitado: Boolean(p.mestre_solicitado_em),
  }));

  return (
    <div>
      <h1 className="titulo-display titulo-secao">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {usuarios.length} {usuarios.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
      </p>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
