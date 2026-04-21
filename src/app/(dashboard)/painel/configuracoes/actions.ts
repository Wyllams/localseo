"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, account, avaliacoes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { user } from "@/db/schema";

/**
 * Busca o OAuth2Client autenticado do Google para o usuário logado.
 * Busca tokens da tabela `account` do Better-Auth (onde o Google OAuth salva).
 * 
 * NÃO retorna o token para o client-side — toda comunicação com Google
 * acontece server-side.
 */
async function getGoogleAuthForUser(userId: string) {
  const accountDb = await bd.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });

  if (!accountDb?.accessToken || !accountDb?.refreshToken) {
    return { erro: "Token do Google não encontrado. Faça logout e login novamente com o Google para reconectar." };
  }

  const { getAuthClient } = await import("@/lib/google/mybusiness");
  const authClient = getAuthClient(accountDb.accessToken, accountDb.refreshToken);
  return { authClient, accountDb };
}

/**
 * Carrega as contas GMB do usuário logado.
 * NÃO expõe tokens para o client-side.
 */
export async function carregarDadosGMB() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  const resultado = await getGoogleAuthForUser(sessao.user.id);
  if ("erro" in resultado) {
    return { erro: resultado.erro };
  }

  try {
    const { listAccounts } = await import("@/lib/google/mybusiness");
    const accounts = await listAccounts(resultado.authClient);
    return {
      accounts: accounts.map((a: any) => ({
        name: a.name,
        accountName: a.accountName || a.name,
        type: a.type,
      })),
      contaAtual: negocioDb?.gmbContaId,
      localAtual: negocioDb?.gmbLocalId,
    };
  } catch (erro: any) {
    console.error("[GMB] Erro ao carregar contas:", erro);
    
    const status = erro?.code || erro?.response?.status;
    if (status === 403) {
      return {
        erro: "Acesso negado. Sua conta Google pode não ter permissão de Owner/Manager no Google Meu Negócio. Verifique se você tem um perfil GMB ativo e reconecte.",
      };
    }
    if (status === 401) {
      return {
        erro: "Token expirado. Faça logout e login novamente para renovar a conexão com o Google.",
      };
    }
    
    return {
      erro: `Erro ao comunicar com Google: ${erro.message}. Verifique se seu perfil GMB está verificado e ativo.`,
    };
  }
}

/**
 * Carrega locais/lojas de uma conta GMB.
 */
export async function carregarLocaisGMB(accountName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const resultado = await getGoogleAuthForUser(sessao.user.id);
  if ("erro" in resultado) {
    return { erro: resultado.erro };
  }

  try {
    const { listLocations } = await import("@/lib/google/mybusiness");
    const locations = await listLocations(resultado.authClient, accountName);
    return {
      locais: locations.map((l: any) => ({
        name: l.name,
        title: l.title || l.name,
        endereco: l.address?.addressLines?.join(", ") || l.address?.locality || "",
        telefone: l.phoneNumbers?.primaryPhone || "",
        categoria: l.categories?.primaryCategory?.displayName || "",
      })),
    };
  } catch (erro: any) {
    console.error("[GMB] Erro ao carregar locais:", erro);
    
    const status = erro?.code || erro?.response?.status;
    if (status === 403) {
      return { erro: "Sem permissão para acessar os locais desta conta. Você precisa ser Owner ou Manager." };
    }
    
    return { erro: `Erro ao listar locais: ${erro.message}` };
  }
}

/**
 * Testa a conexão com o GMB e retorna dados reais da localização.
 * Valida que a API responde e que o local existe.
 */
export async function testarConexaoGMB(locationName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

  const resultado = await getGoogleAuthForUser(sessao.user.id);
  if ("erro" in resultado) {
    return { sucesso: false, erro: resultado.erro };
  }

  try {
    const { getLocationInfo, getReviews, starRatingToNumber } = await import("@/lib/google/mybusiness");

    // 1. Buscar dados da localização
    const location = await getLocationInfo(resultado.authClient, locationName);
    if (!location) {
      return { sucesso: false, erro: "Localização não encontrada no Google. Verifique o ID." };
    }

    // 2. Tentar buscar reviews (valida permissão R/W)
    let totalReviews = 0;
    let notaMedia = 0;
    try {
      const reviewsData = await getReviews(resultado.authClient, locationName, 5);
      totalReviews = reviewsData.totalReviews ?? 0;
      notaMedia = reviewsData.averageRating ?? 0;
    } catch {
      // Reviews podem falhar se não houver nenhum — não é erro fatal
      console.log("[GMB] Sem reviews disponíveis (normal para perfil novo).");
    }

    return {
      sucesso: true,
      dados: {
        nome: location.title,
        endereco: location.address?.addressLines?.join(", ") || location.address?.locality || "Não informado",
        telefone: location.phoneNumbers?.primaryPhone || "Não informado",
        categoria: location.categories?.primaryCategory?.displayName || "Não informada",
        website: location.websiteUri || "Não informado",
        status: location.openInfo?.status || "UNKNOWN",
        totalReviews,
        notaMedia: Math.round(notaMedia * 10) / 10,
      },
    };
  } catch (erro: any) {
    console.error("[GMB] Erro ao testar conexão:", erro);
    return {
      sucesso: false,
      erro: `Falha ao acessar a API do Google: ${erro.message}`,
    };
  }
}

/**
 * Salva a vinculação conta/local GMB no negócio do usuário.
 * Após salvar, faz sync inicial de reviews (não espera o cron de 6h).
 */
export async function salvarConfiguracaoGMB(accountName: string, locationName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  try {
    // Buscar tokens do Better-Auth para salvar criptografados na tabela negocios
    const accountDb = await bd.query.account.findFirst({
      where: and(eq(account.userId, sessao.user.id), eq(account.providerId, "google")),
    });

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });

    if (!negocioDb) {
      return { erro: "Negócio não encontrado. Complete o onboarding primeiro." };
    }

    const updateData: Record<string, unknown> = {
      gmbContaId: accountName,
      gmbLocalId: locationName,
      atualizadoEm: new Date(),
    };

    // Salvar tokens criptografados se disponíveis (para uso offline/cron)
    if (accountDb?.accessToken && accountDb?.refreshToken) {
      const { encrypt } = await import("@/lib/crypto");
      
      // Verifica se já não está criptografado (evitar dupla criptografia)
      const isAlreadyEncrypted = (t: string) => {
        const idx = t.indexOf(":");
        return idx === 32 && /^[0-9a-f]+$/.test(t.substring(0, 32));
      };

      updateData.gAccessToken = isAlreadyEncrypted(accountDb.accessToken)
        ? accountDb.accessToken
        : encrypt(accountDb.accessToken);
      updateData.gRefreshToken = isAlreadyEncrypted(accountDb.refreshToken)
        ? accountDb.refreshToken
        : encrypt(accountDb.refreshToken);
      updateData.gTokenExpiry = accountDb.accessTokenExpiresAt;
    }

    await bd
      .update(negocios)
      .set(updateData)
      .where(eq(negocios.donoId, sessao.user.id));

    // === Sync inicial de reviews (background, não bloqueia) ===
    syncInicialReviews(negocioDb.id, accountDb, locationName).catch((err) => {
      console.error("[GMB] Erro no sync inicial de reviews (não-fatal):", err);
    });

    revalidatePath("/painel/perfil-gmb");
    revalidatePath("/painel/configuracoes");
    revalidatePath("/painel/avaliacoes");
    return { sucesso: true };
  } catch (erro) {
    console.error("[GMB] Erro ao salvar configuração:", erro);
    return { erro: "Erro ao salvar conexão GMB no banco de dados." };
  }
}

/**
 * Faz sync inicial de reviews imediatamente após conectar o GMB.
 * Roda em background (fire-and-forget) para não bloquear a UI.
 */
async function syncInicialReviews(
  negocioId: string,
  accountDb: any,
  locationName: string
): Promise<void> {
  if (!accountDb?.accessToken || !accountDb?.refreshToken) return;

  const { getAuthClient, getReviews, starRatingToNumber } = await import("@/lib/google/mybusiness");
  const authClient = getAuthClient(accountDb.accessToken, accountDb.refreshToken);

  const resultado = await getReviews(authClient, locationName, 50);
  if (!resultado.reviews || resultado.reviews.length === 0) {
    console.log("[GMB Sync Inicial] Nenhum review encontrado.");
    return;
  }

  let novos = 0;
  for (const review of resultado.reviews) {
    const googleReviewId = review.name;
    const nota = starRatingToNumber(review.starRating);

    // Verificar se já existe
    const existente = await bd.query.avaliacoes.findFirst({
      where: eq(avaliacoes.googleReviewId, googleReviewId),
    });

    if (existente) continue; // Já existe, pular

    const sentimentoBase =
      nota >= 4 ? "POSITIVO" : nota === 3 ? "NEUTRO" : "NEGATIVO";

    await bd.insert(avaliacoes).values({
      negocioId,
      googleReviewId,
      autor: review.reviewer?.displayName || "Anônimo",
      nota,
      texto: review.comment || null,
      sentimento: sentimentoBase,
      respondido: !!review.reviewReply,
      textoResposta: review.reviewReply?.comment || null,
      respondidoEm: review.reviewReply?.updateTime
        ? new Date(review.reviewReply.updateTime)
        : null,
      alertaEnviado: false,
      publicadoEm: new Date(review.createTime),
    });

    novos++;
  }

  console.log(`[GMB Sync Inicial] ✅ ${novos} reviews novos sincronizados.`);
}

/* ===== Actions de Perfil do Usuário ===== */

export async function atualizarPerfilUsuario(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });

  if (!sessao?.user?.id) {
    throw new Error("Não autorizado");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const endereco = formData.get("endereco") as string;

  if (!name || !email) {
    throw new Error("Nome e Email são obrigatórios");
  }

  try {
    await bd
      .update(user)
      .set({
        name,
        email,
        telefone,
        endereco,
      })
      .where(eq(user.id, sessao.user.id));

    revalidatePath("/painel/configuracoes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Falha ao salvar as informações do perfil." };
  }
}

export async function alterarSenhaUsuario(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    return { success: false, error: "Preencha ambas as senhas." };
  }

  try {
    const res = await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    return { success: false, error: error.message || "Senha atual incorreta ou erro interno." };
  }
}
