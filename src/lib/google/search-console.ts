/**
 * Cliente Google Search Console (Webmasters) API.
 *
 * Usa a API do Search Console para obter dados de performance:
 * - Keywords que geram tráfego
 * - Cliques, impressões, CTR, posição média
 * - Top páginas
 *
 * Requer o scope: https://www.googleapis.com/auth/webmasters.readonly
 *
 * @see https://developers.google.com/webmaster-tools/search-console-api-original
 */

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { decrypt } from "@/lib/crypto";

/* ===== Tipos ===== */

export interface SearchPerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchPerformanceResult {
  rows: SearchPerformanceRow[];
  responseAggregationType?: string;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel: string;
}

/* ===== Factory: Auth ===== */

/**
 * Cria um OAuth2Client autenticado para o Search Console.
 */
export function getSearchConsoleAuth(
  accessToken: string,
  refreshToken: string
): OAuth2Client {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
  );

  client.setCredentials({
    access_token: decrypt(accessToken),
    refresh_token: decrypt(refreshToken),
  });

  return client;
}

/* ===== Funções ===== */

/**
 * Lista todos os sites verificados no Search Console do usuário.
 */
export async function listSites(auth: OAuth2Client): Promise<SiteInfo[]> {
  try {
    const webmasters = google.searchconsole({
      version: "v1",
      auth,
    });

    const res = await webmasters.sites.list();
    return (
      res.data.siteEntry?.map((s) => ({
        siteUrl: s.siteUrl ?? "",
        permissionLevel: s.permissionLevel ?? "",
      })) ?? []
    );
  } catch (error) {
    console.error("[Search Console] Erro ao listar sites:", error);
    throw error;
  }
}

/**
 * Obtém dados de performance de busca (keywords, cliques, impressões, CTR, posição).
 *
 * @param siteUrl - URL do site (ex: "https://barbearia.rikoseo.com.br")
 * @param startDate - Data inicial no formato "YYYY-MM-DD"
 * @param endDate - Data final no formato "YYYY-MM-DD"
 * @param dimensions - Dimensões para agrupar ("query", "page", "device", "country", "date")
 * @param rowLimit - Número máximo de linhas retornadas
 */
export async function getSearchPerformance(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ["query"],
  rowLimit = 100
): Promise<SearchPerformanceResult> {
  try {
    const webmasters = google.searchconsole({
      version: "v1",
      auth,
    });

    const res = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        searchType: "web",
      },
    });

    return {
      rows:
        res.data.rows?.map((r) => ({
          keys: r.keys ?? [],
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          ctr: r.ctr ?? 0,
          position: r.position ?? 0,
        })) ?? [],
      responseAggregationType: res.data.responseAggregationType ?? undefined,
    };
  } catch (error) {
    console.error("[Search Console] Erro ao obter performance:", error);
    throw error;
  }
}

/**
 * Obtém as top keywords que geram tráfego.
 */
export async function getTopKeywords(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit = 50
): Promise<SearchPerformanceRow[]> {
  const result = await getSearchPerformance(
    auth,
    siteUrl,
    startDate,
    endDate,
    ["query"],
    limit
  );
  return result.rows;
}

/**
 * Obtém as top páginas por cliques.
 */
export async function getTopPages(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit = 20
): Promise<SearchPerformanceRow[]> {
  const result = await getSearchPerformance(
    auth,
    siteUrl,
    startDate,
    endDate,
    ["page"],
    limit
  );
  return result.rows;
}

/**
 * Obtém performance agrupada por data (para gráficos).
 */
export async function getPerformanceByDate(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<SearchPerformanceRow[]> {
  const result = await getSearchPerformance(
    auth,
    siteUrl,
    startDate,
    endDate,
    ["date"],
    500 // até 500 dias
  );
  return result.rows;
}
