"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    await bd
      .update(negocios)
      .set(camposUpdate)
      .where(eq(negocios.id, negocioDb.id));

    revalidatePath("/painel/perfil-gmb");
    return { sucesso: true };
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
