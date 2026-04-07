/**
 * Rastreador de Ranking — Salva posições das keywords no histórico.
 *
 * Quando o Search Console está conectado, usa dados reais da API.
 * Quando não está conectado, produz dados simulados para demonstração.
 */

import { bd } from "@/db";
import {
  negocios,
  palavrasChaveNegocio,
  historicoRanking,
  execucoesAgente,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSearchConsoleAuth, getTopKeywords } from "@/lib/google/search-console";

/* ===== Tipos ===== */
export interface ResultadoRastreamento {
  keywordsRastreadas: number;
  novasEntradas: number;
  erros: string[];
}

/**
 * Executa rastreamento de ranking para todas as keywords de um negócio.
 */
export async function rastrearRanking(negocioId: string): Promise<ResultadoRastreamento> {
  const inicio = Date.now();
  const erros: string[] = [];
  let novasEntradas = 0;

  const negocio = await bd.query.negocios.findFirst({
    where: eq(negocios.id, negocioId),
  });

  if (!negocio) {
    throw new Error("Negócio não encontrado");
  }

  // Buscar keywords do negócio
  const keywords = await bd.query.palavrasChaveNegocio.findMany({
    where: eq(palavrasChaveNegocio.negocioId, negocioId),
  });

  if (keywords.length === 0) {
    return { keywordsRastreadas: 0, novasEntradas: 0, erros: ["Nenhuma keyword cadastrada"] };
  }

  // Tentar usar Search Console real
  if (negocio.scConectado && negocio.gAccessToken && negocio.gRefreshToken && negocio.scSiteUrl) {
    try {
      const authClient = getSearchConsoleAuth(negocio.gAccessToken, negocio.gRefreshToken);

      // Últimos 28 dias
      const hoje = new Date();
      const inicio28 = new Date(hoje);
      inicio28.setDate(inicio28.getDate() - 28);

      const topKws = await getTopKeywords(
        authClient,
        negocio.scSiteUrl,
        inicio28.toISOString().split("T")[0],
        hoje.toISOString().split("T")[0],
        100
      );

      // Mapear keywords do SC para as nossas cadastradas
      for (const kw of keywords) {
        const scData = topKws.find(
          (r) => r.keys[0]?.toLowerCase() === kw.palavraChave.toLowerCase()
        );

        await bd.insert(historicoRanking).values({
          negocioId,
          palavraChave: kw.palavraChave,
          posicao: scData ? Math.round(scData.position) : null,
          posicaoMaps: null,
          fonte: "SEARCH_CONSOLE",
        });
        novasEntradas++;
      }
    } catch (erro) {
      console.error("[Rastreador] Erro Search Console:", erro);
      erros.push("Falha ao acessar Search Console. Usando estimativa.");
      // Fallback para simulação
      novasEntradas += await simularRanking(negocioId, keywords);
    }
  } else {
    // Sem Search Console — simular dados para demo
    novasEntradas += await simularRanking(negocioId, keywords);
  }

  // Salvar execução
  await bd.insert(execucoesAgente).values({
    negocioId,
    tipo: "RANK_TRACKER",
    status: erros.length > 0 ? "FALHOU" : "SUCESSO",
    resultado: {
      keywordsRastreadas: keywords.length,
      novasEntradas,
      erros,
    },
    duracaoMs: Date.now() - inicio,
  });

  return {
    keywordsRastreadas: keywords.length,
    novasEntradas,
    erros,
  };
}

/**
 * Simula dados de ranking para demonstração (quando SC não está conectado).
 * Usa heurísticas baseadas no tipo de keyword e aleatoriedade controlada.
 */
async function simularRanking(
  negocioId: string,
  keywords: { palavraChave: string; tipo: string }[]
): Promise<number> {
  let count = 0;

  for (const kw of keywords) {
    // Heurística: keywords mais específicas (long tail) tendem a ranquear melhor
    let basePos = 15;
    if (kw.tipo === "LONG_TAIL") basePos = 5;
    else if (kw.tipo === "TRANSACTIONAL") basePos = 8;
    else if (kw.tipo === "INFORMATIONAL") basePos = 12;
    else if (kw.tipo === "SECONDARY") basePos = 18;

    // Variação aleatória controlada
    const variacao = Math.floor(Math.random() * 10) - 3;
    const posicao = Math.max(1, Math.min(100, basePos + variacao));

    // Maps geralmente 2-5 posições melhor para negócios locais
    const posicaoMaps = Math.max(1, posicao - Math.floor(Math.random() * 5) - 1);

    await bd.insert(historicoRanking).values({
      negocioId,
      palavraChave: kw.palavraChave,
      posicao,
      posicaoMaps,
      fonte: "ESTIMATIVA",
    });
    count++;
  }

  return count;
}

/**
 * Calcula métricas agregadas de analytics (simuladas quando SC não conectado).
 */
export function calcularMetricasAnalytics(scConectado: boolean, keywords: number): {
  cliques: number;
  impressoes: number;
  ctr: number;
  posicaoMedia: number;
} {
  if (!scConectado || keywords === 0) {
    // Dados simulados proporcionais
    const baseCliques = 45 + Math.floor(Math.random() * 80);
    const baseImpressoes = baseCliques * (8 + Math.floor(Math.random() * 12));
    return {
      cliques: baseCliques * Math.max(1, Math.floor(keywords / 2)),
      impressoes: baseImpressoes * Math.max(1, Math.floor(keywords / 2)),
      ctr: parseFloat((Math.random() * 4 + 1.5).toFixed(1)),
      posicaoMedia: parseFloat((Math.random() * 15 + 5).toFixed(1)),
    };
  }

  return { cliques: 0, impressoes: 0, ctr: 0, posicaoMedia: 0 };
}
