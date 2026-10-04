"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceRole } from "@/lib/supabase/service-role";
import { formatBRL } from "@/lib/format";
import { STATUS_INGRESSO_LABEL } from "@/lib/eventos/labels";
import { notificarUsuarioSobreIngresso } from "@/lib/notificacoes/ingresso";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (!perfil || perfil.papel !== "admin") throw new Error("Só admin pode fazer isso.");

  return { supabase };
}

export async function aprovarIngressoAction(ingressoId: string, eventoId: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("evento_ingressos")
    .update({ status: "aprovado", aprovado_em: new Date().toISOString() })
    .eq("id", ingressoId);

  if (error) {
    console.error("[aprovarIngressoAction] erro:", error.message);
    throw new Error("Não deu pra aprovar o ingresso.");
  }

  await notificarUsuarioSobreIngresso(ingressoId, "aprovado");

  revalidatePath(`/admin/eventos/${eventoId}`);
}

export async function recusarIngressoAction(ingressoId: string, eventoId: string, motivo?: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("evento_ingressos")
    .update({
      status: "recusado",
      motivo_recusa: motivo || null,
      cancelado_em: new Date().toISOString(),
    })
    .eq("id", ingressoId);

  if (error) {
    console.error("[recusarIngressoAction] erro:", error.message);
    throw new Error("Não deu pra recusar o ingresso.");
  }

  await notificarUsuarioSobreIngresso(ingressoId, "recusado", motivo);

  revalidatePath(`/admin/eventos/${eventoId}`);
}

/** Uma célula de CSV: escapa aspas e envolve sempre, pra vírgula e quebra de linha não partirem a coluna. */
function celula(valor: string | number | null | undefined) {
  return `"${String(valor ?? "").replace(/"/g, '""')}"`;
}

/**
 * Lista completa dos pedidos de ingresso em CSV, pro admin levar pra portaria
 * do evento. O e-mail não está em `profiles` — mora em `auth.users`, que só a
 * chave de service_role lê. Por isso a permissão é conferida antes, à mão.
 */
export async function exportarIngressosAction(eventoId: string) {
  const { supabase } = await exigirAdmin();

  const [{ data: evento }, { data: ingressos, error }] = await Promise.all([
    supabase.from("eventos").select("slug, titulo").eq("id", eventoId).maybeSingle(),
    supabase
      .from("evento_ingressos")
      .select(
        "status, criado_em, aprovado_em, usuario_id, profiles!evento_ingressos_usuario_id_fkey(nome_completo, nome_exibicao, username, telefone), evento_ingresso_tipos(nome, preco_centavos)",
      )
      .eq("evento_id", eventoId)
      .order("criado_em"),
  ]);

  if (error) {
    console.error("[exportarIngressosAction] erro ao buscar ingressos:", error.message);
    return { ok: false as const, error: "Não deu pra montar a lista." };
  }

  const linhas = ingressos ?? [];
  const admin = serviceRole();
  const emails = new Map<string, string>();
  await Promise.all(
    [...new Set(linhas.map((i) => i.usuario_id as string))].map(async (id) => {
      const { data, error: erroEmail } = await admin.auth.admin.getUserById(id);
      if (erroEmail) {
        console.error("[exportarIngressosAction] erro ao buscar e-mail:", erroEmail.message);
        return;
      }
      if (data.user?.email) emails.set(id, data.user.email);
    }),
  );

  const cabecalho = [
    "Nome completo",
    "Nome de exibição",
    "Usuário",
    "E-mail",
    "Telefone",
    "Ingresso",
    "Valor",
    "Status",
    "Pedido em",
    "Aprovado em",
  ];

  const corpo = linhas.map((i) => {
    const p = i.profiles as unknown as {
      nome_completo: string | null;
      nome_exibicao: string;
      username: string;
      telefone: string | null;
    } | null;
    const tipo = i.evento_ingresso_tipos as unknown as { nome: string; preco_centavos: number } | null;
    const dataBr = (v: string | null) => (v ? new Date(v).toLocaleString("pt-BR") : "");

    return [
      p?.nome_completo ?? "",
      p?.nome_exibicao ?? "",
      p?.username ? `@${p.username}` : "",
      emails.get(i.usuario_id as string) ?? "",
      p?.telefone ?? "",
      tipo?.nome ?? "",
      tipo ? formatBRL(tipo.preco_centavos) : "",
      STATUS_INGRESSO_LABEL[i.status] ?? i.status,
      dataBr(i.criado_em as string),
      dataBr(i.aprovado_em as string | null),
    ].map(celula).join(";");
  });

  // Separador ";" e BOM: é assim que o Excel em português abre o arquivo com
  // as colunas separadas e os acentos certos, sem precisar importar na mão.
  const csv = `﻿${[cabecalho.map(celula).join(";"), ...corpo].join("\r\n")}\r\n`;
  const nome = `ingressos-${evento?.slug ?? eventoId}-${new Date().toISOString().slice(0, 10)}.csv`;

  return { ok: true as const, csv, nome, total: linhas.length };
}
