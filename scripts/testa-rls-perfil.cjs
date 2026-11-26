/**
 * Teste de RLS do perfil público.
 *
 *   node --env-file=.env.local scripts/testa-rls-perfil.cjs
 *
 * Existe por causa de um susto: `perfil_publico` estava no banco desde o
 * começo e nunca tinha sido desligado por ninguém, porque não havia tela.
 * Quando a tela apareceu, desligar o perfil de UMA pessoa fez a listagem
 * pública de mesas inteira responder `stack depth limit exceeded` — a policy
 * de `profiles` chamava `eh_admin()`, que lia `profiles`, que disparava a
 * policy de novo.
 *
 * Então este roteiro não confere só "o perfil fechado some". Ele confere
 * principalmente que o resto do site continua de pé com um perfil fechado no
 * banco, que é a parte que ninguém pensaria em testar.
 */

const { createClient } = require("@supabase/supabase-js");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltou variável de ambiente. Rode com: node --env-file=.env.local scripts/testa-rls-perfil.cjs");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

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
  const marca = `rls-perfil-${Date.now()}`;
  const lixo = { aberto: null, fechado: null, mesa: null };

  try {
    const { data: sis, error: erroSis } = await admin.from("sistemas").select("id").eq("ativo", true).limit(1).single();
    if (erroSis) throw new Error(`achar um sistema: ${erroSis.message}`);

    async function criaPessoa(sufixo, publico) {
      const username = `${marca}${sufixo}`.replace(/-/g, "");
      const u = await admin.auth.admin.createUser({
        email: `${marca}-${sufixo}@exemplo.invalid`,
        password: "senha-de-teste-123",
        email_confirm: true,
        user_metadata: { username, nome_exibicao: `Teste ${sufixo}`, data_nascimento: "1990-01-01" },
      });
      if (u.error) throw new Error(`criar ${sufixo}: ${u.error.message}`);
      await admin
        .from("profiles")
        .update({ perfil_publico: publico, bio: `bio de ${sufixo}` })
        .eq("id", u.data.user.id);
      return { id: u.data.user.id, username };
    }

    lixo.aberto = await criaPessoa("aberto", true);
    lixo.fechado = await criaPessoa("fechado", false);

    // O perfil fechado mestra uma mesa publicada: é essa combinação que
    // derrubava a listagem.
    const m = await admin
      .from("mesas")
      .insert({
        mestre_id: lixo.fechado.id,
        sistema_id: sis.id,
        slug: `${marca}-mesa`,
        titulo: `Mesa ${marca}`,
        sinopse: "Mesa de teste de RLS de perfil. Some sozinha no fim.",
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
        status: "publicada",
      })
      .select("id")
      .single();
    if (m.error) throw new Error(`criar mesa: ${m.error.message}`);
    lixo.mesa = m.data.id;

    console.log("\nVisitante deslogado — o perfil:");

    const vAberto = await anon
      .from("profiles")
      .select("username, bio")
      .eq("username", lixo.aberto.username)
      .maybeSingle();
    checa("vê o perfil aberto", Boolean(vAberto.data), vAberto.error?.message ?? "veio vazio");

    const vFechado = await anon
      .from("profiles")
      .select("username, bio")
      .eq("username", lixo.fechado.username)
      .maybeSingle();
    checa("NÃO vê o perfil fechado", !vFechado.error && !vFechado.data, vFechado.error?.message ?? "o perfil voltou");

    console.log("\nE o resto do site continua de pé:");

    // O teste que importa. Antes da migration 20261124120000 isto respondia
    // `stack depth limit exceeded` e levava /mesas junto.
    const listagem = await anon
      .from("mesas")
      .select("titulo, profiles!mesas_mestre_id_fkey(nome_exibicao)")
      .in("status", ["publicada", "confirmada", "em_andamento"]);
    checa(
      "a listagem pública de mesas não quebra",
      !listagem.error,
      listagem.error?.message,
    );
    checa(
      "a mesa do perfil fechado continua na listagem",
      (listagem.data ?? []).some((x) => x.titulo === `Mesa ${marca}`),
      listagem.error ? "a consulta falhou" : "a mesa sumiu",
    );

    const umaMesa = await anon
      .from("mesas")
      .select("titulo, profiles!mesas_mestre_id_fkey(nome_exibicao)")
      .eq("id", lixo.mesa)
      .maybeSingle();
    checa(
      "a página da mesa abre sem o nome do mestre",
      !umaMesa.error && umaMesa.data !== null && umaMesa.data.profiles === null,
      umaMesa.error?.message ?? `profiles = ${JSON.stringify(umaMesa.data?.profiles)}`,
    );
  } finally {
    if (lixo.mesa) await admin.from("mesas").delete().eq("id", lixo.mesa);
    if (lixo.aberto) await admin.auth.admin.deleteUser(lixo.aberto.id);
    if (lixo.fechado) await admin.auth.admin.deleteUser(lixo.fechado.id);
  }

  console.log(`\n${passou} passaram, ${falhou} falharam.`);
  process.exitCode = falhou === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("\nO teste não chegou ao fim:", e.message);
  process.exitCode = 1;
});
