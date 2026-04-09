"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, account } from "@/db/schema";
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
  return { authClient };
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
      // NÃO retornamos accessToken — segurança
    };
  } catch (erro: any) {
    console.error("[GMB] Erro ao carregar contas:", erro);
    
    // Tratamento específico de erros de permissão
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
 * Salva a vinculação conta/local GMB no negócio do usuário.
 */
export async function salvarConfiguracaoGMB(accountName: string, locationName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  try {
    // Buscar tokens do Better-Auth para salvar criptografados na tabela negocios
    const accountDb = await bd.query.account.findFirst({
      where: and(eq(account.userId, sessao.user.id), eq(account.providerId, "google")),
    });

    const updateData: Record<string, unknown> = {
      gmbContaId: accountName,
      gmbLocalId: locationName,
      atualizadoEm: new Date(),
    };

    // Salvar tokens criptografados se disponíveis (para uso offline/cron)
    if (accountDb?.accessToken && accountDb?.refreshToken) {
      const { encrypt } = await import("@/lib/crypto");
      
      // Criptografar antes de salvar (os tokens do Better-Auth são plaintext)
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

    revalidatePath("/painel/perfil-gmb");
    revalidatePath("/painel/configuracoes");
    return { sucesso: true };
  } catch (erro) {
    console.error("[GMB] Erro ao salvar configuração:", erro);
    return { erro: "Erro ao salvar conexão GMB no banco de dados." };
  }
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
