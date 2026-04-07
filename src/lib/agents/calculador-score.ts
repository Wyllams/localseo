/**
 * Calculador de Score de Presença — 4 Pilares (0-100).
 *
 * Pilar 1: GMB (0-25) — Perfil completo + posts recentes + GMB conectado
 * Pilar 2: Avaliações (0-25) — Nota média + quantidade + respostas
 * Pilar 3: Site/SEO (0-25) — Landing pages + keywords + NAP consistente
 * Pilar 4: Blog/Conteúdo (0-25) — Artigos publicados + frequência
 *
 * Total = soma dos 4 pilares.
 */

import { bd } from "@/db";
import {
  negocios,
  avaliacoes,
  postagens,
  artigos,
  landingPages,
  palavrasChaveNegocio,
  verificacoesNap,
  pontuacoesPresenca,
} from "@/db/schema";
import { eq, desc, count, gte, and } from "drizzle-orm";

export interface ScorePilares {
  gmb: number;
  avaliacoes: number;
  site: number;
  blog: number;
  total: number;
}

export interface ScoreDetalhado extends ScorePilares {
  detalhes: {
    gmb: { perfilCompleto: boolean; gmbConectado: boolean; postsRecentes: number };
    avaliacoes: { total: number; comResposta: number; notaMedia: number };
    site: { landingPages: number; keywords: number; napConsistente: boolean };
    blog: { artigosPublicados: number; artigosTotal: number };
  };
}

/**
 * Calcula e salva o score de presença para um negócio.
 */
export async function calcularScore(negocioId: string): Promise<ScoreDetalhado> {
  const negocio = await bd.query.negocios.findFirst({
    where: eq(negocios.id, negocioId),
  });

  if (!negocio) throw new Error("Negócio não encontrado");

  const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Buscar dados em paralelo
  const [
    avaliacoesRes,
    postsMesRes,
    artigosRes,
    artigosPublicadosRes,
    lpsRes,
    kwsRes,
    napRes,
  ] = await Promise.all([
    bd.query.avaliacoes.findMany({
      where: eq(avaliacoes.negocioId, negocioId),
      columns: { id: true, nota: true, textoResposta: true },
    }),
    bd.select({ count: count() })
      .from(postagens)
      .where(and(eq(postagens.negocioId, negocioId), gte(postagens.criadoEm, trintaDias))),
    bd.select({ count: count() })
      .from(artigos)
      .where(eq(artigos.negocioId, negocioId)),
    bd.select({ count: count() })
      .from(artigos)
      .where(and(eq(artigos.negocioId, negocioId), eq(artigos.status, "PUBLICADO"))),
    bd.select({ count: count() })
      .from(landingPages)
      .where(and(eq(landingPages.negocioId, negocioId), eq(landingPages.ativo, true))),
    bd.select({ count: count() })
      .from(palavrasChaveNegocio)
      .where(eq(palavrasChaveNegocio.negocioId, negocioId)),
    bd.query.verificacoesNap.findMany({
      where: eq(verificacoesNap.negocioId, negocioId),
      orderBy: [desc(verificacoesNap.verificadoEm)],
      limit: 10,
    }),
  ]);

  // ===== PILAR 1: GMB (0-25) =====
  let gmb = 0;
  const gmbConectado = !!negocio.gmbLocalId;
  const perfilCompleto = !!(negocio.nome && negocio.telefone && negocio.endereco && negocio.cidade);
  const postsRecentes = postsMesRes[0]?.count || 0;

  if (gmbConectado) gmb += 8;
  if (perfilCompleto) gmb += 7;
  if (negocio.descricao) gmb += 3;
  if (postsRecentes >= 4) gmb += 7;
  else if (postsRecentes >= 2) gmb += 4;
  else if (postsRecentes >= 1) gmb += 2;
  gmb = Math.min(25, gmb);

  // ===== PILAR 2: Avaliações (0-25) =====
  let avaliacoesScore = 0;
  const totalAvaliacoes = avaliacoesRes.length;
  const comResposta = avaliacoesRes.filter((a) => a.textoResposta).length;
  const notaMedia = totalAvaliacoes > 0
    ? avaliacoesRes.reduce((s, a) => s + (a.nota || 0), 0) / totalAvaliacoes
    : 0;

  if (totalAvaliacoes >= 20) avaliacoesScore += 8;
  else if (totalAvaliacoes >= 10) avaliacoesScore += 5;
  else if (totalAvaliacoes >= 5) avaliacoesScore += 3;
  else if (totalAvaliacoes >= 1) avaliacoesScore += 1;

  if (notaMedia >= 4.5) avaliacoesScore += 8;
  else if (notaMedia >= 4.0) avaliacoesScore += 5;
  else if (notaMedia >= 3.5) avaliacoesScore += 3;

  const taxaResposta = totalAvaliacoes > 0 ? comResposta / totalAvaliacoes : 0;
  if (taxaResposta >= 0.8) avaliacoesScore += 9;
  else if (taxaResposta >= 0.5) avaliacoesScore += 5;
  else if (taxaResposta >= 0.2) avaliacoesScore += 2;
  avaliacoesScore = Math.min(25, avaliacoesScore);

  // ===== PILAR 3: Site/SEO (0-25) =====
  let site = 0;
  const totalLPs = lpsRes[0]?.count || 0;
  const totalKWs = kwsRes[0]?.count || 0;
  const napConsistente = napRes.length === 0 || napRes.every((n) => n.consistente);

  if (totalLPs >= 3) site += 8;
  else if (totalLPs >= 1) site += 4;

  if (totalKWs >= 10) site += 7;
  else if (totalKWs >= 5) site += 5;
  else if (totalKWs >= 1) site += 2;

  if (napConsistente) site += 5;
  if (negocio.website) site += 3;
  if (negocio.scConectado) site += 2;
  site = Math.min(25, site);

  // ===== PILAR 4: Blog/Conteúdo (0-25) =====
  let blog = 0;
  const totalArtigosCount = artigosRes[0]?.count || 0;
  const artigosPublicados = artigosPublicadosRes[0]?.count || 0;

  if (artigosPublicados >= 10) blog += 12;
  else if (artigosPublicados >= 5) blog += 8;
  else if (artigosPublicados >= 3) blog += 5;
  else if (artigosPublicados >= 1) blog += 2;

  if (totalArtigosCount >= 15) blog += 8;
  else if (totalArtigosCount >= 8) blog += 5;
  else if (totalArtigosCount >= 3) blog += 3;

  // Diversidade de conteúdo
  if (totalArtigosCount > 0 && totalLPs > 0) blog += 5;
  blog = Math.min(25, blog);

  // Total
  const total = gmb + avaliacoesScore + site + blog;

  // Salvar no banco
  await bd.insert(pontuacoesPresenca).values({
    negocioId,
    total,
    pontuacaoGmb: gmb,
    pontuacaoAvaliacoes: avaliacoesScore,
    pontuacaoSite: site,
    pontuacaoBlog: blog,
  });

  return {
    gmb,
    avaliacoes: avaliacoesScore,
    site,
    blog,
    total,
    detalhes: {
      gmb: { perfilCompleto, gmbConectado, postsRecentes },
      avaliacoes: { total: totalAvaliacoes, comResposta, notaMedia: parseFloat(notaMedia.toFixed(1)) },
      site: { landingPages: totalLPs, keywords: totalKWs, napConsistente },
      blog: { artigosPublicados, artigosTotal: totalArtigosCount },
    },
  };
}
