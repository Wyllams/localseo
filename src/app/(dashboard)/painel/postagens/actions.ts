"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import {
  postagens,
  negocios,
  execucoesAgente,
  palavrasChaveNegocio,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { gerarPostagemGMB } from "@/lib/agents/agente-posts";
import { buscarImagemUnsplash } from "@/lib/unsplash";

/**
 * Gera um rascunho de postagem com IA (NÃO publica automaticamente).
 * Retorna o conteúdo e imagem para preview/edição antes de publicar.
 */
export async function gerarRascunhoPostIA(opts: {
  instrucao?: string;
  tipo?: "NOVIDADE" | "OFERTA" | "EVENTO";
  palavraChave?: string;
}) {
  try {
    const inicioExecucao = Date.now();

    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // Instrução enriquecida com a keyword
    const instrucaoFinal = [
      opts.instrucao,
      opts.palavraChave
        ? `Use a palavra-chave "${opts.palavraChave}" de forma natural no texto.`
        : undefined,
      opts.tipo ? `O tipo do post deve ser: ${opts.tipo}.` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    // 1. Gerar conteúdo com IA
    const resultadoIA = await gerarPostagemGMB({
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
      instrucaoPersonalizada: instrucaoFinal || undefined,
    });

    // 2. Buscar imagem contextual
    const urlImagem = await buscarImagemUnsplash(
      resultadoIA.termo_busca_imagem
    );

    // 3. Log de execução
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "GMB",
      status: "SUCESSO",
      resultado: { ...resultadoIA, imagemFinal: urlImagem },
      duracaoMs: Date.now() - inicioExecucao,
    });

    return {
      sucesso: true,
      rascunho: {
        conteudo: resultadoIA.conteudo,
        imagemUrl: urlImagem,
        tipo: opts.tipo ?? resultadoIA.tipo,
        palavraChave: opts.palavraChave,
      },
    };
  } catch (erro) {
    console.error("Action error gerarRascunhoPostIA:", erro);
    return { sucesso: false, erro: "Erro interno na IA ao gerar o post." };
  }
}

/**
 * Salva o rascunho editado no banco e opcionalmente publica.
 */
export async function salvarPostagem(opts: {
  conteudo: string;
  imagemUrl?: string;
  tipo: "NOVIDADE" | "OFERTA" | "EVENTO";
  palavraChave?: string;
  publicar: boolean;
}) {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    if (!opts.conteudo || opts.conteudo.trim().length < 10) {
      return { sucesso: false, erro: "O conteúdo deve ter pelo menos 10 caracteres." };
    }

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    let statusFinal: "RASCUNHO" | "PUBLICADO" | "FALHOU" = opts.publicar
      ? "PUBLICADO"
      : "RASCUNHO";

    // Se publicar está ativo, tenta enviar ao GMB
    if (opts.publicar) {
      if (
        negocioDb.gAccessToken &&
        negocioDb.gRefreshToken &&
        negocioDb.gmbLocalId &&
        !negocioDb.gmbContaId?.includes("sandbox")
      ) {
        try {
          const { getAuthClient, createPost } = await import("@/lib/google/mybusiness");
          const authClient = getAuthClient(negocioDb.gAccessToken, negocioDb.gRefreshToken);

          // Mapear tipo interno para tipo da API GMB
          const topicTypeMap: Record<string, "STANDARD" | "OFFER" | "EVENT"> = {
            NOVIDADE: "STANDARD",
            OFERTA: "OFFER",
            EVENTO: "EVENT",
          };

          const gmbPostId = await createPost(authClient, negocioDb.gmbLocalId, {
            topicType: topicTypeMap[opts.tipo] || "STANDARD",
            summary: opts.conteudo,
            media: opts.imagemUrl
              ? [{ mediaFormat: "PHOTO", sourceUrl: opts.imagemUrl }]
              : undefined,
            callToAction: negocioDb.website
              ? { actionType: "LEARN_MORE", url: negocioDb.website }
              : undefined,
          });

          statusFinal = "PUBLICADO";
          console.log(`[GMB] Post publicado no Google: ${gmbPostId}`);
        } catch (erroGmb: any) {
          console.error("[GMB] Erro ao publicar post no Google:", erroGmb);
          statusFinal = "FALHOU"; // NÃO marcar como publicado se falhou!
        }
      } else {
        // GMB não conectado — salvar como rascunho com aviso
        console.log("[GMB] GMB não conectado, salvando post como rascunho.");
        statusFinal = "RASCUNHO";
      }
    }

    // Salvar no banco
    await bd.insert(postagens).values({
      negocioId: negocioDb.id,
      conteudo: opts.conteudo.trim(),
      imagemUrl: opts.imagemUrl || null,
      palavraChave: opts.palavraChave || null,
      tipo: opts.tipo,
      status: statusFinal,
      publicadoEm: opts.publicar ? new Date() : null,
    });

    revalidatePath("/painel/postagens");
    return { sucesso: true, status: statusFinal };
  } catch (erro) {
    console.error("Action error salvarPostagem:", erro);
    return { sucesso: false, erro: "Erro ao salvar postagem." };
  }
}

/**
 * Exclui uma postagem do banco.
 */
export async function excluirPostagem(id: string) {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    await bd
      .delete(postagens)
      .where(
        and(eq(postagens.id, id), eq(postagens.negocioId, negocioDb.id))
      );

    revalidatePath("/painel/postagens");
    return { sucesso: true };
  } catch (erro) {
    console.error("Action error excluirPostagem:", erro);
    return { sucesso: false, erro: "Erro ao excluir." };
  }
}

/**
 * Busca palavras-chave do negócio para seleção no criador.
 */
export async function buscarPalavrasChave() {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return [];

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return [];

    const kws = await bd.query.palavrasChaveNegocio.findMany({
      where: eq(palavrasChaveNegocio.negocioId, negocioDb.id),
    });

    return kws.map((k) => ({ id: k.id, palavra: k.palavraChave }));
  } catch {
    return [];
  }
}
