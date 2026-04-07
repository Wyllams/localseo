"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calcularScore, type ScoreDetalhado } from "@/lib/agents/calculador-score";

export async function recalcularScore(): Promise<{
  sucesso: boolean;
  resultado?: ScoreDetalhado;
  erro?: string;
}> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    const resultado = await calcularScore(negocioDb.id);

    revalidatePath("/painel");
    revalidatePath("/painel/relatorios");

    return { sucesso: true, resultado };
  } catch (erro) {
    console.error("[Score Action] Erro:", erro);
    return { sucesso: false, erro: "Erro ao calcular score." };
  }
}
