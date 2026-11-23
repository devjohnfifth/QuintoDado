/**
 * Teste de RLS do painel da mesa.
 *
 *   node --env-file=.env.local scripts/testa-rls-painel.cjs
 *
 * Por que isto existe como script e não como teste do vitest: as travas do
 * painel moram no Postgres, não no TypeScript. Um teste que roda com mock
 * não prova nada aqui — o que prova é entrar no banco de verdade com o
 * token de alguém que não é da mesa e ver o que volta.
 *
 * O roteiro cria um usuário descartável (sem nenhuma relação com a mesa),
 * entra como ele usando a chave anônima — a mesma do navegador — e confere
 * as duas metades da regra:
 *
 *   LER   é de quem tem conta: ele enxerga ficha revelada e sessão
 *         publicada de mesa que está no ar.
 *   NÃO   enxerga ficha oculta, campo não revelado, sessão em rascunho,
 *         nem nada de mesa que não foi publicada.
 *   NÃO   escreve: criar ficha, criar sessão e apagar têm que falhar.
 *
 * No fim apaga tudo que criou. Se algo explodir no meio, a limpeza roda
 * mesmo assim.
 */

const { createClient } = require("@supabase/supabase-js");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltou variável de ambiente. Rode com: node --env-file=.env.local scripts/testa-rls-painel.cjs");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let passou = 0;
let falhou = 0;

function checa(nome, condicao, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  ok    ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

async function main() {
  const marca = `rls-painel-${Date.now()}`;
  const lixo = { mesaNoAr: null, mesaFechada: null, usuario: null, email: null };

  try {
    // ---------- cenário ------------------------------------------------
    // Mesas próprias do teste, pra não depender do que já existe no banco
    // nem sujar mesa de verdade.
    const mestre = await admin.auth.admin.createUser({
      email: `${marca}-mestre@exemplo.invalid`,
      password: "senha-de-teste-123",
      email_confirm: true,
      // `username` e `data_nascimento` são o que o trigger `ao_criar_usuario`
      // precisa pra montar o profile. Sem eles o createUser falha com um
      // "Database error creating new user" que não diz o motivo.
      user_metadata: { username: `${marca}-m`.replace(/-/g, ""), nome_exibicao: "Mestre do teste", data_nascimento: "1990-01-01" },
    });
    if (mestre.error) throw new Error(`criar mestre: ${mestre.error.message}`);
    const mestreId = mestre.data.user.id;
    lixo.mestre = mestreId;

    // Qualquer sistema serve; a mesa é descartável.
    const sis = await admin.from("sistemas").select("id").limit(1).single();
    if (sis.error) throw new Error(`achar um sistema: ${sis.error.message}`);

    const base = {
      mestre_id: mestreId,
      sistema_id: sis.data.id,
      titulo: `Mesa ${marca}`,
      sinopse: "Mesa criada por script de teste de RLS. Some sozinha no fim.",
      tipo: "one_shot",
      modalidade: "online",
      classificacao: "livre",
      nivel_experiencia: "todos",
      vagas_total: 4,
      min_jogadores: 2,
      preco_centavos: 0,
      modelo_cobranca: "por_sessao",
      cobranca_gerenciada_pelo_site: false,
      frequencia: "unica",
      data_inicio: "2027-01-01",
      horario_inicio: "19:00:00",
      horario_fim: "23:00:00",
    };

    const noAr = await admin
      .from("mesas")
      .insert({ ...base, slug: `${marca}-no-ar`, status: "publicada" })
      .select("id")
      .single();
    if (noAr.error) throw new Error(`criar mesa publicada: ${noAr.error.message}`);
    lixo.mesaNoAr = noAr.data.id;

    const fechada = await admin
      .from("mesas")
      .insert({ ...base, slug: `${marca}-fechada`, status: "aguardando_aprovacao" })
      .select("id")
      .single();
    if (fechada.error) throw new Error(`criar mesa fechada: ${fechada.error.message}`);
    lixo.mesaFechada = fechada.data.id;

    // Conteúdo: uma ficha revelada, uma oculta, uma sessão publicada e uma
    // em rascunho — e o mesmo na mesa que não foi ao ar.
    const fichas = await admin
      .from("painel_entidades")
      .insert([
        { mesa_id: lixo.mesaNoAr, tipo: "npc", nome: "Taverneiro revelado", oculta: false },
        { mesa_id: lixo.mesaNoAr, tipo: "npc", nome: "Vilão secreto", oculta: true },
        { mesa_id: lixo.mesaFechada, tipo: "npc", nome: "Ficha de mesa fechada", oculta: false },
      ])
      .select("id, nome, oculta, mesa_id");
    if (fichas.error) throw new Error(`criar fichas: ${fichas.error.message}`);
    const revelada = fichas.data.find((f) => f.nome === "Taverneiro revelado");
    const oculta = fichas.data.find((f) => f.nome === "Vilão secreto");

    const campos = await admin
      .from("painel_campos")
      .insert([
        { mesa_id: lixo.mesaNoAr, entidade_id: revelada.id, rotulo: "Apelido", valor: "Beto", vis: "mesa" },
        { mesa_id: lixo.mesaNoAr, entidade_id: revelada.id, rotulo: "Segredo", valor: "é espião", vis: "oculto" },
      ])
      .select("id, rotulo");
    if (campos.error) throw new Error(`criar campos: ${campos.error.message}`);

    const sessoes = await admin
      .from("painel_sessoes")
      .insert([
        { mesa_id: lixo.mesaNoAr, numero: 1, resumo_md: "A mesa leu isto.", publicado: true },
        { mesa_id: lixo.mesaNoAr, numero: 2, resumo_md: "Rascunho do mestre.", publicado: false },
      ])
      .select("id, numero");
    if (sessoes.error) throw new Error(`criar sessões: ${sessoes.error.message}`);

    // ---------- o espectador --------------------------------------------
    lixo.email = `${marca}-espectador@exemplo.invalid`;
    const novo = await admin.auth.admin.createUser({
      email: lixo.email,
      password: "senha-de-teste-123",
      email_confirm: true,
      user_metadata: { username: `${marca}-e`.replace(/-/g, ""), nome_exibicao: "Espectador", data_nascimento: "1990-01-01" },
    });
    if (novo.error) throw new Error(`criar espectador: ${novo.error.message}`);
    lixo.usuario = novo.data.user.id;

    const como = createClient(URL, ANON, { auth: { persistSession: false } });
    const entrou = await como.auth.signInWithPassword({ email: lixo.email, password: "senha-de-teste-123" });
    if (entrou.error) throw new Error(`entrar como espectador: ${entrou.error.message}`);

    // ---------- LER: o que ele tem que ver ------------------------------
    console.log("\nEspectador (tem conta, não é da mesa) — o que ele LÊ:");

    const ve = await como.from("painel_entidades").select("id, nome").eq("mesa_id", lixo.mesaNoAr);
    const nomes = (ve.data ?? []).map((e) => e.nome);
    checa("vê a ficha revelada", nomes.includes("Taverneiro revelado"), ve.error?.message ?? `veio ${JSON.stringify(nomes)}`);
    checa("NÃO vê a ficha oculta", !nomes.includes("Vilão secreto"), `veio ${JSON.stringify(nomes)}`);

    const vc = await como.from("painel_campos").select("rotulo").eq("entidade_id", revelada.id);
    const rotulos = (vc.data ?? []).map((c) => c.rotulo);
    checa("vê o campo revelado", rotulos.includes("Apelido"), vc.error?.message ?? `veio ${JSON.stringify(rotulos)}`);
    checa("NÃO vê o campo oculto", !rotulos.includes("Segredo"), `veio ${JSON.stringify(rotulos)}`);

    const vs = await como.from("painel_sessoes").select("numero, publicado").eq("mesa_id", lixo.mesaNoAr);
    const numeros = (vs.data ?? []).map((s) => s.numero);
    checa("vê a sessão publicada", numeros.includes(1), vs.error?.message ?? `veio ${JSON.stringify(numeros)}`);
    checa("NÃO vê a sessão em rascunho", !numeros.includes(2), `veio ${JSON.stringify(numeros)}`);

    const vf = await como.from("painel_entidades").select("id").eq("mesa_id", lixo.mesaFechada);
    checa("NÃO vê nada de mesa que não foi publicada", (vf.data ?? []).length === 0, `veio ${(vf.data ?? []).length} linha(s)`);

    const vr = await como.from("painel_revelacoes").select("id").eq("mesa_id", lixo.mesaNoAr);
    checa("NÃO vê o log de revelações", (vr.data ?? []).length === 0, `veio ${(vr.data ?? []).length} linha(s)`);

    // ---------- ESCREVER: nada ------------------------------------------
    console.log("\nEspectador — o que ele NÃO ESCREVE:");

    const ins = await como
      .from("painel_entidades")
      .insert({ mesa_id: lixo.mesaNoAr, tipo: "npc", nome: "Invasor", oculta: false, criado_por: lixo.usuario })
      .select("id");
    checa("NÃO cria ficha", Boolean(ins.error), ins.error ? "" : "o insert passou");

    const insS = await como
      .from("painel_sessoes")
      .insert({ mesa_id: lixo.mesaNoAr, numero: 99, publicado: true, criado_por: lixo.usuario })
      .select("id");
    checa("NÃO cria sessão", Boolean(insS.error), insS.error ? "" : "o insert passou");

    const upd = await como.from("painel_entidades").update({ nome: "Renomeado" }).eq("id", revelada.id).select("id");
    checa("NÃO renomeia ficha de outra pessoa", (upd.data ?? []).length === 0, `mexeu em ${(upd.data ?? []).length} linha(s)`);

    const del = await como.from("painel_sessoes").delete().eq("id", sessoes.data[0].id).select("id");
    checa("NÃO apaga sessão", (del.data ?? []).length === 0, `apagou ${(del.data ?? []).length} linha(s)`);

    const insA = await como
      .from("painel_anotacoes")
      .insert({ mesa_id: lixo.mesaNoAr, autor_id: lixo.usuario, texto: "oi", vis: "mesa" })
      .select("id");
    checa("NÃO cria anotação", Boolean(insA.error), insA.error ? "" : "o insert passou");

    // ---------- deslogado não vê nada ------------------------------------
    console.log("\nVisitante deslogado:");
    const anonimo = createClient(URL, ANON, { auth: { persistSession: false } });
    const va = await anonimo.from("painel_entidades").select("id").eq("mesa_id", lixo.mesaNoAr);
    checa("NÃO vê ficha nenhuma", (va.data ?? []).length === 0, `veio ${(va.data ?? []).length} linha(s)`);
    const vas = await anonimo.from("painel_sessoes").select("id").eq("mesa_id", lixo.mesaNoAr);
    checa("NÃO vê sessão nenhuma", (vas.data ?? []).length === 0, `veio ${(vas.data ?? []).length} linha(s)`);
  } finally {
    // Limpeza. As mesas levam o painel junto por `on delete cascade`.
    if (lixo.mesaNoAr) await admin.from("mesas").delete().eq("id", lixo.mesaNoAr);
    if (lixo.mesaFechada) await admin.from("mesas").delete().eq("id", lixo.mesaFechada);
    if (lixo.usuario) await admin.auth.admin.deleteUser(lixo.usuario);
    if (lixo.mestre) await admin.auth.admin.deleteUser(lixo.mestre);
  }

  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exit(falhou === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\nO teste não chegou ao fim:", e.message);
  process.exit(1);
});
