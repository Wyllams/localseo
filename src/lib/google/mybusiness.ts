/**
 * Cliente Google Business Profile API.
 *
 * Centraliza todas as chamadas para a API do Google Meu Negócio:
 * - Listar perfis/localizações (Account Management v1 + Business Information v1)
 * - Obter e responder avaliações (v4 REST — ainda ativo)
 * - Criar posts / updates (v4 REST — ainda ativo)
 * - Obter informações e atualizar perfil (Business Information v1)
 * - Métricas de performance (Performance API v1)
 * - Keywords de busca (Performance API v1)
 *
 * @see https://developers.google.com/my-business/reference/rest
 */

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { decrypt } from "@/lib/crypto";

/* ===== Tipos ===== */

export interface GmbLocation {
  name: string; // accounts/{id}/locations/{id} ou locations/{id}
  title: string;
  address?: {
    addressLines?: string[];
    locality?: string; // Cidade
    administrativeArea?: string; // Estado
    postalCode?: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
  };
  websiteUri?: string;
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
  };
  openInfo?: {
    status?: string;
  };
}

export interface GmbReview {
  name: string; // accounts/{id}/locations/{id}/reviews/{id}
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GmbPost {
  topicType: "STANDARD" | "OFFER" | "EVENT";
  summary: string;
  media?: {
    mediaFormat: "PHOTO";
    sourceUrl: string;
  }[];
  callToAction?: {
    actionType: "LEARN_MORE" | "BOOK" | "ORDER" | "SHOP" | "SIGN_UP" | "CALL";
    url?: string;
  };
}

export interface GmbLocationUpdate {
  title?: string;
  phoneNumbers?: { primaryPhone: string };
  websiteUri?: string;
  profile?: { description: string };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
}

export interface GmbPerformanceData {
  buscasMaps: number;
  buscasSearch: number;
  cliquesWebsite: number;
  cliquesLigacao: number;
  pedidosDirecao: number;
  seriesTemporal: { data: string; impressoes: number; acoes: number }[];
}

export interface GmbSearchKeyword {
  keyword: string;
  impressions: number;
}

/* ===== Helper: Star rating → número ===== */
const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function starRatingToNumber(rating: string): number {
  return STAR_MAP[rating] ?? 0;
}

/* ===== Helper: Detecta formato e descriptografa se necessário ===== */

/**
 * Detecta se o token está criptografado (formato iv_hex:encrypted_hex)
 * e descriptografa automaticamente. Se for plaintext, retorna como está.
 */
function safeDecrypt(token: string): string {
  // Tokens criptografados com AES-256-CBC têm o formato: iv_hex(32chars):encrypted_hex
  // Um IV hex tem exatamente 32 caracteres, então o separador ':' estaria na posição 32
  const separatorIndex = token.indexOf(":");
  if (separatorIndex === 32 && /^[0-9a-f]+$/.test(token.substring(0, 32))) {
    try {
      return decrypt(token);
    } catch {
      // Se falhar a descriptografia, assume que é plaintext
      return token;
    }
  }
  return token;
}

/* ===== Helper: Extrair locationId puro de um resource name ===== */

/**
 * Extrai o ID limpo de uma location a partir do resource name completo.
 * "accounts/123/locations/456" → "locations/456"
 * "locations/456" → "locations/456"
 */
export function extractLocationName(fullName: string): string {
  const match = fullName.match(/locations\/[\w-]+/);
  return match ? match[0] : fullName;
}

/* ===== Factory: Autenticação OAuth2 ===== */

/**
 * Cria um OAuth2Client autenticado.
 * Aceita tokens criptografados (AES-256-CBC) ou plaintext.
 * O OAuth2Client do Google faz auto-refresh do token quando expira.
 */
export function getAuthClient(
  accessToken: string,
  refreshToken: string
): OAuth2Client {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
  );

  client.setCredentials({
    access_token: safeDecrypt(accessToken),
    refresh_token: safeDecrypt(refreshToken),
  });

  return client;
}

/* ===== Funções da API: Account Management ===== */

/**
 * Lista todas as contas GMB do usuário autenticado.
 * Usa a API v1 (mybusinessaccountmanagement).
 */
export async function listAccounts(auth: OAuth2Client) {
  try {
    const mybusiness = google.mybusinessaccountmanagement({
      version: "v1",
      auth,
    });

    const res = await mybusiness.accounts.list();
    return res.data.accounts ?? [];
  } catch (error: unknown) {
    const apiError = error as { code?: number; response?: { status?: number }; message?: string };
    console.error("[GMB] Erro ao listar contas:", apiError.message);
    throw error;
  }
}

/* ===== Funções da API: Business Information ===== */

/**
 * Lista todas as localizações (perfis) de uma conta.
 */
export async function listLocations(
  auth: OAuth2Client,
  accountName: string
): Promise<GmbLocation[]> {
  try {
    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth,
    });

    const res = await mybusiness.accounts.locations.list({
      parent: accountName,
      readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,openInfo",
    });

    return (res.data.locations ?? []) as GmbLocation[];
  } catch (error) {
    console.error("[GMB] Erro ao listar localizações:", error);
    throw error;
  }
}

/**
 * Obtém informações detalhadas de uma localização.
 */
export async function getLocationInfo(
  auth: OAuth2Client,
  locationName: string
): Promise<GmbLocation | null> {
  try {
    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth,
    });

    // A API espera o formato "locations/{id}" sem o prefixo "accounts/"
    const cleanName = extractLocationName(locationName);

    const res = await mybusiness.locations.get({
      name: cleanName,
      readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,openInfo",
    });

    return res.data as GmbLocation;
  } catch (error) {
    console.error("[GMB] Erro ao obter info da localização:", error);
    throw error;
  }
}

/**
 * Atualiza informações do perfil diretamente no Google.
 * Usa locations.patch da Business Information API v1.
 *
 * @param auth OAuth2Client autenticado
 * @param locationName Resource name da localização (ex: "locations/456")
 * @param updates Campos a atualizar
 * @returns Localização atualizada ou null
 */
export async function updateLocationInfo(
  auth: OAuth2Client,
  locationName: string,
  updates: GmbLocationUpdate
): Promise<GmbLocation | null> {
  try {
    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth,
    });

    const cleanName = extractLocationName(locationName);

    // Montar updateMask com os campos que realmente foram fornecidos
    const maskFields: string[] = [];
    if (updates.title !== undefined) maskFields.push("title");
    if (updates.phoneNumbers !== undefined) maskFields.push("phoneNumbers");
    if (updates.websiteUri !== undefined) maskFields.push("websiteUri");
    if (updates.profile !== undefined) maskFields.push("profile");
    if (updates.storefrontAddress !== undefined) maskFields.push("storefrontAddress");

    if (maskFields.length === 0) {
      console.log("[GMB] Nenhum campo para atualizar no Google.");
      return null;
    }

    const res = await mybusiness.locations.patch({
      name: cleanName,
      updateMask: maskFields.join(","),
      requestBody: updates,
    });

    console.log(`[GMB] Perfil atualizado no Google: ${cleanName} (campos: ${maskFields.join(", ")})`);
    return res.data as GmbLocation;
  } catch (error: unknown) {
    const apiError = error as { code?: number; message?: string };
    console.error("[GMB] Erro ao atualizar perfil no Google:", apiError.message);
    throw error;
  }
}

/* ===== Funções da API: Reviews (v4 REST) ===== */

/**
 * Obtém avaliações de uma localização.
 * Usa endpoint v4 REST (ainda ativo para reviews).
 */
export async function getReviews(
  auth: OAuth2Client,
  locationName: string,
  pageSize = 50
): Promise<{ reviews: GmbReview[]; averageRating?: number; totalReviews?: number }> {
  try {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}`;

    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`GMB Reviews API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return {
      reviews: data.reviews ?? [],
      averageRating: data.averageRating,
      totalReviews: data.totalReviewCount,
    };
  } catch (error) {
    console.error("[GMB] Erro ao obter reviews:", error);
    throw error;
  }
}

/**
 * Responde a uma avaliação específica.
 * Usa endpoint v4 REST.
 */
export async function replyToReview(
  auth: OAuth2Client,
  reviewName: string,
  comment: string
): Promise<void> {
  try {
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`GMB Reply API error (${res.status}): ${errBody}`);
    }

    console.log(`[GMB] Resposta enviada para: ${reviewName}`);
  } catch (error) {
    console.error("[GMB] Erro ao responder review:", error);
    throw error;
  }
}

/* ===== Funções da API: Local Posts (v4 REST) ===== */

/**
 * Cria um post (local post / update) no perfil GMB.
 * Usa endpoint v4 REST.
 */
export async function createPost(
  auth: OAuth2Client,
  locationName: string,
  post: GmbPost
): Promise<string | null> {
  try {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;

    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`GMB Post API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    console.log(`[GMB] Post criado: ${data.name}`);
    return data.name ?? null;
  } catch (error) {
    console.error("[GMB] Erro ao criar post:", error);
    throw error;
  }
}

/* ===== Funções da API: Performance Metrics (v1 REST) ===== */

/**
 * Obtém métricas de performance do perfil GMB.
 * Usa a Performance API v1 — fetchMultiDailyMetricsTimeSeries.
 *
 * @param auth OAuth2Client autenticado
 * @param locationName Resource name no formato "locations/{id}"
 * @param diasAtras Número de dias para buscar (padrão: 28)
 * @returns Dados de performance agregados + séries temporais
 */
export async function getPerformanceMetrics(
  auth: OAuth2Client,
  locationName: string,
  diasAtras = 28
): Promise<GmbPerformanceData> {
  try {
    const cleanName = extractLocationName(locationName);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - diasAtras);

    const url = `https://businessprofileperformance.googleapis.com/v1/${cleanName}:fetchMultiDailyMetricsTimeSeries`;

    const token = await auth.getAccessToken();
    const params = new URLSearchParams({
      "dailyMetrics": "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "dailyRange.startDate.year": String(startDate.getFullYear()),
      "dailyRange.startDate.month": String(startDate.getMonth() + 1),
      "dailyRange.startDate.day": String(startDate.getDate()),
      "dailyRange.endDate.year": String(endDate.getFullYear()),
      "dailyRange.endDate.month": String(endDate.getMonth() + 1),
      "dailyRange.endDate.day": String(endDate.getDate()),
    });

    // Adicionar múltiplas métricas
    const metrics = [
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "WEBSITE_CLICKS",
      "CALL_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
    ];

    // A API aceita múltiplos dailyMetrics via query param repetido
    const fullUrl = `${url}?${metrics.map(m => `dailyMetrics=${m}`).join("&")}&dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}`;

    const res = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`GMB Performance API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return parsePerformanceResponse(data);
  } catch (error) {
    console.error("[GMB] Erro ao obter métricas de performance:", error);
    throw error;
  }
}

/**
 * Parseia a resposta da Performance API em um formato limpo.
 */
function parsePerformanceResponse(data: any): GmbPerformanceData {
  const result: GmbPerformanceData = {
    buscasMaps: 0,
    buscasSearch: 0,
    cliquesWebsite: 0,
    cliquesLigacao: 0,
    pedidosDirecao: 0,
    seriesTemporal: [],
  };

  const dailyMap = new Map<string, { impressoes: number; acoes: number }>();

  const timeSeries = data.multiDailyMetricTimeSeries ?? [];
  for (const series of timeSeries) {
    const metric = series.dailyMetric as string;
    const dataPoints = series.timeSeries?.datedValues ?? [];

    for (const point of dataPoints) {
      const dateStr = point.date
        ? `${point.date.year}-${String(point.date.month).padStart(2, "0")}-${String(point.date.day).padStart(2, "0")}`
        : "unknown";
      const value = parseInt(point.value ?? "0", 10);

      // Agregar totais
      if (metric.includes("MAPS")) {
        result.buscasMaps += value;
      } else if (metric.includes("SEARCH")) {
        result.buscasSearch += value;
      } else if (metric === "WEBSITE_CLICKS") {
        result.cliquesWebsite += value;
      } else if (metric === "CALL_CLICKS") {
        result.cliquesLigacao += value;
      } else if (metric === "BUSINESS_DIRECTION_REQUESTS") {
        result.pedidosDirecao += value;
      }

      // Série temporal agrupada por dia
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { impressoes: 0, acoes: 0 });
      }
      const entry = dailyMap.get(dateStr)!;
      if (metric.includes("IMPRESSIONS")) {
        entry.impressoes += value;
      } else {
        entry.acoes += value;
      }
    }
  }

  // Converter map em array ordenado
  result.seriesTemporal = Array.from(dailyMap.entries())
    .map(([data, vals]) => ({ data, ...vals }))
    .sort((a, b) => a.data.localeCompare(b.data));

  return result;
}

/**
 * Obtém as keywords que geraram impressões no perfil (últimos 30 dias).
 * Usa Performance API v1 — locations.searchkeywords.impressions.monthly.list
 */
export async function getSearchKeywords(
  auth: OAuth2Client,
  locationName: string
): Promise<GmbSearchKeyword[]> {
  try {
    const cleanName = extractLocationName(locationName);
    const url = `https://businessprofileperformance.googleapis.com/v1/${cleanName}/searchkeywords/impressions/monthly`;

    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Se retornar 404 ou 400, provavelmente a localização não tem dados suficientes
      if (res.status === 404 || res.status === 400) {
        console.log("[GMB] Sem dados de keywords para esta localização (dados insuficientes).");
        return [];
      }
      throw new Error(`GMB Search Keywords API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const keywords: GmbSearchKeyword[] = [];

    for (const item of data.searchKeywordsCounts ?? []) {
      if (item.keyword && item.insightsValue?.value) {
        keywords.push({
          keyword: item.keyword,
          impressions: parseInt(item.insightsValue.value, 10),
        });
      }
    }

    // Ordenar por impressões (mais buscado primeiro)
    return keywords.sort((a, b) => b.impressions - a.impressions);
  } catch (error) {
    console.error("[GMB] Erro ao obter keywords de busca:", error);
    throw error;
  }
}
