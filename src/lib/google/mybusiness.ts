/**
 * Cliente Google My Business API v4.
 *
 * Centraliza todas as chamadas para a API do Google Meu Negócio:
 * - Listar perfis/localizações
 * - Obter e responder avaliações
 * - Criar posts (updates)
 * - Obter informações do perfil
 *
 * @see https://developers.google.com/my-business/reference/rest
 */

import { google, type mybusinessbusinessinformation_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { decrypt } from "@/lib/crypto";

/* ===== Tipos ===== */

export interface GmbLocation {
  name: string; // accounts/{id}/locations/{id}
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

/* ===== Funções da API ===== */

/**
 * Lista todas as contas GMB do usuário autenticado.
 */
export async function listAccounts(auth: OAuth2Client) {
  try {
    const mybusiness = google.mybusinessaccountmanagement({
      version: "v1",
      auth,
    });

    const res = await mybusiness.accounts.list();
    return res.data.accounts ?? [];
  } catch (error) {
    console.error("[GMB] Erro ao listar contas:", error);
    throw error;
  }
}

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
 * Obtém avaliações de uma localização.
 */
export async function getReviews(
  auth: OAuth2Client,
  locationName: string,
  pageSize = 50
): Promise<{ reviews: GmbReview[]; averageRating?: number; totalReviews?: number }> {
  try {
    // A API de reviews usa um endpoint diferente
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

/**
 * Cria um post (local post / update) no perfil GMB.
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

    const res = await mybusiness.locations.get({
      name: locationName,
      readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,openInfo,profile,serviceArea,metadata",
    });

    return res.data as GmbLocation;
  } catch (error) {
    console.error("[GMB] Erro ao obter info da localização:", error);
    throw error;
  }
}
