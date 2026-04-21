/**
 * @deprecated Este módulo foi substituído por @/lib/google/mybusiness.ts
 *
 * Use o cliente unificado em '@/lib/google/mybusiness' que suporta:
 * - Tokens criptografados E plaintext (auto-detect)
 * - OAuth2Client com auto-refresh
 * - Todas as operações: listAccounts, listLocations, createPost, getReviews, replyToReview
 * - Performance API: getPerformanceMetrics, getSearchKeywords
 * - Atualização de perfil: updateLocationInfo
 *
 * Este arquivo é mantido apenas para compatibilidade reversa.
 * NÃO use em código novo.
 */

export { getAuthClient as getGoogleAuth } from "@/lib/google/mybusiness";
export { listAccounts as listarContasGMB } from "@/lib/google/mybusiness";
export { listLocations as listarLocaisGMB } from "@/lib/google/mybusiness";
export { createPost as publicarPostGMB } from "@/lib/google/mybusiness";
export { updateLocationInfo as atualizarPerfilGMB } from "@/lib/google/mybusiness";

// Re-exportar getGoogleAccessToken para não quebrar imports existentes
import { bd } from "@/db";
import { account } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";

/**
 * @deprecated Use getAuthClient de @/lib/google/mybusiness em vez disso.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  console.warn("[DEPRECATED] getGoogleAccessToken() — use getAuthClient() de @/lib/google/mybusiness");
  const accountQuery = await bd.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });

  if (!accountQuery || !accountQuery.accessToken) {
    return null;
  }
  return accountQuery.accessToken;
}
