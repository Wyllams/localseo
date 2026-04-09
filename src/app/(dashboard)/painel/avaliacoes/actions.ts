"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { avaliacoes, negocios, execucoesAgente } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analisarEResponderAvaliacao } from "@/lib/agents/agente-avaliacoes";

/**
 * Gera uma sugestão de resposta com IA (NÃO publica automaticamente).
 * Retorna o texto sugerido para o usuário revisar e editar antes de publicar.
 */
export async function gerarRespostaComIA(avaliacaoId: string) {
  try {
    const inicioExecucao = Date.now();

    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const avaliacaoDb = await bd.query.avaliacoes.findFirst({
      where: eq(avaliacoes.id, avaliacaoId),
    });

    if (!avaliacaoDb || !avaliacaoDb.texto) {
      return { sucesso: false, erro: "Avaliação não encontrada ou sem texto." };
    }

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.id, avaliacaoDb.negocioId),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    const resultadoIA = await analisarEResponderAvaliacao({
      nota: avaliacaoDb.nota,
      texto: avaliacaoDb.texto,
      nomeCliente: avaliacaoDb.autor,
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
    });

    // Salvar log de execução
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "AVALIACOES",
      status: "SUCESSO",
      resultado: resultadoIA,
      duracaoMs: Date.now() - inicioExecucao,
    });

    // Atualizar sentimento (mas NÃO marca como respondido ainda)
    await bd
      .update(avaliacoes)
      .set({ sentimento: resultadoIA.sentimento })
      .where(eq(avaliacoes.id, avaliacaoId));

    revalidatePath("/painel/avaliacoes");

    return {
      sucesso: true,
      resposta: resultadoIA.resposta_sugerida,
      sentimento: resultadoIA.sentimento,
    };
  } catch (erro) {
    console.error("Action error gerarRespostaComIA:", erro);
    return { sucesso: false, erro: "Ocorreu um erro interno na IA." };
  }
}

/**
 * Publica a resposta (editada ou não) no banco E no Google.
 * Se o GMB estiver conectado e a avaliação tiver googleReviewId,
 * tenta postar a resposta via API do Google automaticamente.
 */
export async function publicarResposta(avaliacaoId: string, textoResposta: string) {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    if (!textoResposta || textoResposta.trim().length < 5) {
      return { sucesso: false, erro: "Resposta muito curta." };
    }

    const avaliacaoDb = await bd.query.avaliacoes.findFirst({
      where: eq(avaliacoes.id, avaliacaoId),
    });

    if (!avaliacaoDb) return { sucesso: false, erro: "Avaliação não encontrada." };

    // Buscar negócio para checar conexão GMB
    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.id, avaliacaoDb.negocioId),
    });

    // 1. Salvar no banco local (sempre funciona)
    await bd
      .update(avaliacoes)
      .set({
        textoResposta: textoResposta.trim(),
        respondido: true,
        respondidoEm: new Date(),
      })
      .where(eq(avaliacoes.id, avaliacaoId));

    // 2. Tentar postar no Google se GMB estiver conectado
    let publicadoNoGoogle = false;
    let erroGoogle: string | undefined;

    if (
      avaliacaoDb.googleReviewId &&
      negocioDb?.gAccessToken &&
      negocioDb?.gRefreshToken &&
      !negocioDb.gmbContaId?.includes("sandbox")
    ) {
      try {
        const { getAuthClient, replyToReview } = await import("@/lib/google/mybusiness");
        const authClient = getAuthClient(negocioDb.gAccessToken, negocioDb.gRefreshToken);
        await replyToReview(authClient, avaliacaoDb.googleReviewId, textoResposta.trim());
        publicadoNoGoogle = true;
        console.log(`[GMB] Resposta publicada no Google para review: ${avaliacaoDb.googleReviewId}`);
      } catch (erroGmb: any) {
        console.error("[GMB] Falha ao publicar resposta no Google:", erroGmb);
        erroGoogle = erroGmb.message || "Erro desconhecido ao publicar no Google";
        // NÃO bloqueia — a resposta já foi salva localmente
      }
    }

    revalidatePath("/painel/avaliacoes");
    return {
      sucesso: true,
      publicadoNoGoogle,
      avisoGoogle: erroGoogle
        ? `Resposta salva localmente, mas houve um erro ao publicar no Google: ${erroGoogle}`
        : undefined,
    };
  } catch (erro) {
    console.error("Action error publicarResposta:", erro);
    return { sucesso: false, erro: "Erro ao salvar resposta." };
  }
}

