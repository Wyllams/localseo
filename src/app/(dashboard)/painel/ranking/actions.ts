"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, palavrasChaveNegocio, historicoRanking } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { rastrearRanking, type ResultadoRastreamento } from "@/lib/agents/rastreador-ranking";

export async function executarRastreamento(): Promise<{
  sucesso: boolean;
  resultado?: ResultadoRastreamento;
  erro?: string;
}> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    const resultado = await rastrearRanking(negocioDb.id);

    revalidatePath("/painel/ranking");
    revalidatePath("/painel/analytics");

    return { sucesso: true, resultado };
  } catch (erro) {
    console.error("[Ranking Action] Erro:", erro);
    return { sucesso: false, erro: "Erro ao executar rastreamento." };
  }
}

export async function limparHistorico(): Promise<{ sucesso: boolean }> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false };

    await bd.delete(historicoRanking).where(eq(historicoRanking.negocioId, negocioDb.id));

    revalidatePath("/painel/ranking");
    revalidatePath("/painel/analytics");
    return { sucesso: true };
  } catch {
    return { sucesso: false };
  }
}
