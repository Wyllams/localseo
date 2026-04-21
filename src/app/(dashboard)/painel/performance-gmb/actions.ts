"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Busca métricas de performance do GMB (buscas, cliques, direções).
 * Retorna dados dos últimos N dias.
 */
export async function buscarMetricasGMB(diasAtras = 28) {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    if (
      !negocioDb.gAccessToken ||
      !negocioDb.gRefreshToken ||
      !negocioDb.gmbLocalId ||
      negocioDb.gmbContaId?.includes("sandbox")
    ) {
      return { sucesso: false, erro: "GMB não conectado." };
    }

    const { getAuthClient, getPerformanceMetrics, getSearchKeywords } =
      await import("@/lib/google/mybusiness");

    const authClient = getAuthClient(
      negocioDb.gAccessToken,
      negocioDb.gRefreshToken
    );

    // Buscar métricas e keywords em paralelo
    const [metricas, keywords] = await Promise.allSettled([
      getPerformanceMetrics(authClient, negocioDb.gmbLocalId, diasAtras),
      getSearchKeywords(authClient, negocioDb.gmbLocalId),
    ]);

    const performance =
      metricas.status === "fulfilled" ? metricas.value : null;
    const kws =
      keywords.status === "fulfilled" ? keywords.value : [];

    if (!performance) {
      return {
        sucesso: false,
        erro: "Sem dados de performance. A localização pode ser nova ou não ter tráfego suficiente.",
      };
    }

    return {
      sucesso: true,
      metricas: performance,
      keywords: kws.slice(0, 10), // Top 10 keywords
    };
  } catch (erro: any) {
    console.error("[GMB Performance] Erro:", erro);
    return {
      sucesso: false,
      erro: `Erro ao buscar métricas: ${erro.message}`,
    };
  }
}
