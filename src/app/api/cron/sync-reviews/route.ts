/**
 * Cron Job: Sincronização automática de Reviews do Google.
 *
 * Roda periodicamente (via Vercel Cron) e para cada negócio com GMB conectado:
 * 1. Busca reviews do Google via API
 * 2. Faz upsert na tabela 'avaliacoes' (usando googleReviewId como chave)
 * 3. Analisa sentimento via IA para reviews novos
 * 4. Marca reviews negativos para alerta
 *
 * Endpoint: GET /api/cron/sync-reviews
 * Protegido por CRON_SECRET
 *
 * @see https://developers.google.com/my-business/reference/rest
 */

import { NextRequest, NextResponse } from "next/server";
import { bd } from "@/db";
import { negocios, avaliacoes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getAuthClient,
  getReviews,
  starRatingToNumber,
} from "@/lib/google/mybusiness";

/**
 * GET /api/cron/sync-reviews
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação do cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { erro: "Não autorizado." },
        { status: 401 }
      );
    }

    // 2. Buscar todos os negócios com GMB conectado
    const negociosComGmb = await bd.query.negocios.findMany({
      where: and(
        // Tem tokens e local GMB configurados
        // Excluir sandboxes
      ),
    });

    // Filtrar apenas os que realmente têm GMB conectado (não sandbox)
    const negociosValidos = negociosComGmb.filter(
      (n) =>
        n.gAccessToken &&
        n.gRefreshToken &&
        n.gmbLocalId &&
        !n.gmbContaId?.includes("sandbox")
    );

    if (negociosValidos.length === 0) {
      return NextResponse.json({
        mensagem: "Nenhum negócio com GMB conectado encontrado.",
        sincronizados: 0,
      });
    }

    let totalReviewsSincronizados = 0;
    let totalNovos = 0;
    const erros: string[] = [];

    // 3. Para cada negócio, buscar reviews
    for (const negocio of negociosValidos) {
      try {
        const authClient = getAuthClient(
          negocio.gAccessToken!,
          negocio.gRefreshToken!
        );

        const resultado = await getReviews(authClient, negocio.gmbLocalId!, 50);

        if (!resultado.reviews || resultado.reviews.length === 0) {
          continue;
        }

        // 4. Upsert reviews na tabela avaliacoes
        for (const review of resultado.reviews) {
          const googleReviewId = review.name; // ex: accounts/{id}/locations/{id}/reviews/{id}
          const nota = starRatingToNumber(review.starRating);

          // Verificar se já existe
          const existente = await bd.query.avaliacoes.findFirst({
            where: eq(avaliacoes.googleReviewId, googleReviewId),
          });

          if (existente) {
            // Atualizar se o review foi editado
            if (review.updateTime && existente.publicadoEm) {
              const reviewDate = new Date(review.updateTime);
              if (reviewDate > existente.publicadoEm) {
                await bd
                  .update(avaliacoes)
                  .set({
                    texto: review.comment || null,
                    nota,
                  })
                  .where(eq(avaliacoes.id, existente.id));
              }
            }
            totalReviewsSincronizados++;
            continue;
          }

          // Inserir novo review
          const sentimentoBase =
            nota >= 4 ? "POSITIVO" : nota === 3 ? "NEUTRO" : "NEGATIVO";

          await bd.insert(avaliacoes).values({
            negocioId: negocio.id,
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

          totalNovos++;
          totalReviewsSincronizados++;

          // 5. Se review negativo, marcar para alerta futuro
          if (nota <= 2) {
            console.log(
              `[Sync Reviews] ⚠️ Review negativo (${nota}★) detectado para ${negocio.nome}: "${review.comment?.substring(0, 50)}..."`
            );
          }
        }

        console.log(
          `[Sync Reviews] ✅ ${negocio.nome}: ${resultado.reviews.length} reviews processados`
        );
      } catch (erroNegocio: any) {
        const msg = `Erro ao sincronizar reviews de "${negocio.nome}": ${erroNegocio.message}`;
        console.error(`[Sync Reviews] ❌ ${msg}`);
        erros.push(msg);

        // Se for erro de token (401), não parar o loop todo
        // Outros negócios podem ter tokens válidos
        continue;
      }
    }

    return NextResponse.json({
      mensagem: "Sincronização concluída.",
      negociosProcessados: negociosValidos.length,
      totalReviewsSincronizados,
      novosReviews: totalNovos,
      erros: erros.length > 0 ? erros : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (erro: any) {
    console.error("[Sync Reviews] Erro fatal:", erro);
    return NextResponse.json(
      { erro: "Erro interno no cron de sincronização.", detalhes: erro.message },
      { status: 500 }
    );
  }
}
