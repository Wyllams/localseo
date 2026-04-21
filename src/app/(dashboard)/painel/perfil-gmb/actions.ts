"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schemaAtualizarPerfil = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  descricao: z.string().max(750, "Máximo 750 caracteres").optional(),
});

/**
 * Atualiza campos editáveis do perfil do negócio.
 * Se o GMB estiver conectado, também envia as alterações para o Google.
 */
export async function atualizarPerfilNegocio(dados: {
  nome?: string;
  endereco?: string;
  telefone?: string;
  website?: string;
  descricao?: string;
}) {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // Validar
    const validado = schemaAtualizarPerfil.safeParse(dados);
    if (!validado.success) {
      return {
        sucesso: false,
        erro: validado.error.issues.map((e) => e.message).join(", "),
      };
    }

    // Montar apenas os campos com valor
    const camposUpdate: Record<string, unknown> = { atualizadoEm: new Date() };

    if (dados.nome !== undefined && dados.nome.trim()) {
      camposUpdate.nome = dados.nome.trim();
    }
    if (dados.endereco !== undefined) {
      camposUpdate.endereco = dados.endereco.trim() || null;
    }
    if (dados.telefone !== undefined) {
      camposUpdate.telefone = dados.telefone.trim() || null;
    }
    if (dados.website !== undefined) {
      camposUpdate.website = dados.website.trim() || null;
    }
    if (dados.descricao !== undefined) {
      camposUpdate.descricao = dados.descricao.trim() || null;
    }

    // 1. Salvar no banco local (sempre funciona)
    await bd
      .update(negocios)
      .set(camposUpdate)
      .where(eq(negocios.id, negocioDb.id));

    // 2. Tentar sincronizar com o Google se GMB estiver conectado
    let sincronizadoComGoogle = false;
    let erroGoogle: string | undefined;

    if (
      negocioDb.gAccessToken &&
      negocioDb.gRefreshToken &&
      negocioDb.gmbLocalId &&
      !negocioDb.gmbContaId?.includes("sandbox")
    ) {
      try {
        const { getAuthClient, updateLocationInfo } = await import(
          "@/lib/google/mybusiness"
        );
        const authClient = getAuthClient(
          negocioDb.gAccessToken,
          negocioDb.gRefreshToken
        );

        // Montar payload para a API do Google
        const googleUpdates: Record<string, unknown> = {};

        if (dados.nome?.trim()) {
          googleUpdates.title = dados.nome.trim();
        }
        if (dados.telefone?.trim()) {
          googleUpdates.phoneNumbers = {
            primaryPhone: dados.telefone.trim(),
          };
        }
        if (dados.website?.trim()) {
          googleUpdates.websiteUri = dados.website.trim();
        }
        if (dados.descricao?.trim()) {
          googleUpdates.profile = {
            description: dados.descricao.trim(),
          };
        }
        if (dados.endereco?.trim()) {
          googleUpdates.storefrontAddress = {
            addressLines: [dados.endereco.trim()],
          };
        }

        if (Object.keys(googleUpdates).length > 0) {
          await updateLocationInfo(
            authClient,
            negocioDb.gmbLocalId,
            googleUpdates as any
          );
          sincronizadoComGoogle = true;
          console.log(
            `[GMB] Perfil atualizado no Google para: ${negocioDb.nome}`
          );
        }
      } catch (erroGmb: any) {
        console.error(
          "[GMB] Falha ao sincronizar perfil com Google:",
          erroGmb
        );
        erroGoogle =
          erroGmb.message || "Erro desconhecido ao atualizar no Google";
        // NÃO bloqueia — o banco local já foi atualizado
      }
    }

    revalidatePath("/painel/perfil-gmb");

    return {
      sucesso: true,
      sincronizadoComGoogle,
      avisoGoogle: erroGoogle
        ? `Perfil salvo localmente, mas houve um erro ao atualizar no Google: ${erroGoogle}`
        : undefined,
    };
  } catch (erro) {
    console.error("Action error atualizarPerfilNegocio:", erro);
    return { sucesso: false, erro: "Erro interno ao salvar." };
  }
}

/**
 * Gera uma descrição otimizada via IA e salva no banco.
 */
export async function gerarESalvarDescricaoIA() {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // Import dinâmico para evitar carregar IA desnecessariamente
    const { analisarPerfilGmb } = await import("@/lib/agents/agente-perfil-gmb");

    const resultado = await analisarPerfilGmb({
      nome: negocioDb.nome,
      categoria: negocioDb.categoria,
      cidade: negocioDb.cidade,
      estado: negocioDb.estado ?? undefined,
      endereco: negocioDb.endereco ?? undefined,
      telefone: negocioDb.telefone ?? undefined,
      website: negocioDb.website ?? undefined,
      descricao: undefined, // Forçar geração
      logoUrl: negocioDb.logoUrl ?? undefined,
      gmbConectado: !!negocioDb.gmbLocalId,
    });

    if (resultado.descricaoSugerida) {
      return {
        sucesso: true,
        descricao: resultado.descricaoSugerida,
      };
    }

    return { sucesso: false, erro: "IA não retornou descrição." };
  } catch (erro) {
    console.error("Action error gerarESalvarDescricaoIA:", erro);
    return { sucesso: false, erro: "Erro ao gerar descrição." };
  }
}

/**
 * Busca dados reais do perfil no Google para comparação com dados locais.
 * Utilizado na página de perfil GMB para mostrar divergências.
 */
export async function buscarDadosReaisGoogle() {
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

    const { getAuthClient, getLocationInfo } = await import(
      "@/lib/google/mybusiness"
    );
    const authClient = getAuthClient(
      negocioDb.gAccessToken,
      negocioDb.gRefreshToken
    );

    const location = await getLocationInfo(authClient, negocioDb.gmbLocalId);
    if (!location) {
      return { sucesso: false, erro: "Localização não encontrada no Google." };
    }

    return {
      sucesso: true,
      google: {
        nome: location.title || "",
        endereco:
          location.address?.addressLines?.join(", ") ||
          location.address?.locality ||
          "",
        telefone: location.phoneNumbers?.primaryPhone || "",
        website: location.websiteUri || "",
        categoria:
          location.categories?.primaryCategory?.displayName || "",
        status: location.openInfo?.status || "UNKNOWN",
      },
    };
  } catch (erro: any) {
    console.error("Action error buscarDadosReaisGoogle:", erro);
    return {
      sucesso: false,
      erro: `Erro ao buscar dados do Google: ${erro.message}`,
    };
  }
}
