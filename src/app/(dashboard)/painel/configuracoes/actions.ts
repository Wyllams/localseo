"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGoogleAccessToken, listarContasGMB, listarLocaisGMB } from "@/lib/google-api/gmb";

export async function carregarDadosGMB() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  const accessToken = await getGoogleAccessToken(sessao.user.id);
  if (!accessToken) {
    return { erro: "Token do Google não encontrado. Faça o login novamente." };
  }

  try {
    const accounts = await listarContasGMB(accessToken);
    return {
       accounts, 
       contaAtual: negocioDb?.gmbContaId, 
       localAtual: negocioDb?.gmbLocalId,
       accessToken // Só pra repassar pro clitente se ele for rodar chain, ou eu chamo tudo do server
    };
  } catch (erro: any) {
    console.error("Erro na carga do GMB:", erro);
    return { erro: "Erro ao comunicar com Google. Ficha não verificada? " + erro.message };
  }
}

export async function carregarLocaisGMB(accountName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const accessToken = await getGoogleAccessToken(sessao.user.id);
  if (!accessToken) throw new Error("Sem token.");

  try {
    const locais = await listarLocaisGMB(accessToken, accountName);
    return { locais };
  } catch (erro: any) {
    return { erro: erro.message };
  }
}

export async function salvarConfiguracaoGMB(accountName: string, locationName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  try {
    await bd
      .update(negocios)
      .set({
        gmbContaId: accountName,
        gmbLocalId: locationName,
      })
      .where(eq(negocios.donoId, sessao.user.id));
      
    return { sucesso: true };
  } catch (erro) {
    return { erro: "Erro ao salvar no banco." };
  }
}

import { user } from "@/db/schema";
import { revalidatePath } from "next/cache";

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
