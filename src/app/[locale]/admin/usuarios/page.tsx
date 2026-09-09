import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: perfis, error } = await supabase
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
      <h1 className="font-heading text-2xl font-bold">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {usuarios.length} {usuarios.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
      </p>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
