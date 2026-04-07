import { NextRequest, NextResponse } from "next/server";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Webhook do Asaas — recebe notificações de eventos de pagamento.
 *
 * Eventos tratados:
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED → assinatura ativa
 * - PAYMENT_OVERDUE → assinatura vencida
 * - PAYMENT_DELETED / PAYMENT_REFUNDED → assinatura cancelada/estornada
 *
 * Configuração no painel Asaas:
 * - URL: https://SEU_DOMINIO/api/webhooks/asaas
 * - Versão da API: v3
 * - Token: o valor de ASAAS_WEBHOOK_TOKEN
 * - Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
 *            PAYMENT_DELETED, PAYMENT_REFUNDED
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validar token de autenticação
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken) {
      const headerToken = req.headers.get("asaas-access-token");
      if (headerToken !== webhookToken) {
        console.warn("[Webhook Asaas] Token inválido recebido.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Parse do body
    const body = await req.json();
    const evento = body.event as string;
    const pagamento = body.payment;

    if (!evento || !pagamento) {
      return NextResponse.json(
        { error: "Payload inválido" },
        { status: 400 }
      );
    }

    console.log(`[Webhook Asaas] Evento: ${evento} | Cobrança: ${pagamento.id}`);

    // 3. Identificar o negócio
    const subscriptionId = pagamento.subscription;
    const customerId = pagamento.customer;

    let negocioDb;

    if (subscriptionId) {
      // Pagamento vinculado a uma assinatura
      negocioDb = await bd.query.negocios.findFirst({
        where: eq(negocios.asaasAssinaturaId, subscriptionId),
      });
    }

    // Se não encontrou por assinatura, tentar pelo customer (PIX avulso)
    if (!negocioDb && customerId) {
      negocioDb = await bd.query.negocios.findFirst({
        where: eq(negocios.asaasClienteId, customerId),
      });
    }

    if (!negocioDb) {
      console.warn(
        `[Webhook Asaas] Negócio não encontrado. Sub: ${subscriptionId}, Customer: ${customerId}`
      );
      return NextResponse.json({ received: true });
    }



    // 4. Mapear evento → status interno e ações
    let novoStatus: string;
    const updateData: Record<string, string> = {};

    switch (evento) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        novoStatus = "ACTIVE";

        // Extrair plano da description (PIX avulso): "LocalSEO - Upgrade para plano PRO"
        if (pagamento.description) {
          const desc = pagamento.description as string;
          const planoMatch = desc.match(/plano\s+(STARTER|PRO_PLUS|PRO)/i);
          if (planoMatch) {
            updateData.plano = planoMatch[1].toUpperCase();
            console.log(`[Webhook Asaas] Plano extraído da description: ${updateData.plano}`);
          }
        }
        break;

      case "PAYMENT_OVERDUE":
        novoStatus = "PAST_DUE";
        break;

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_RESTORED":
        novoStatus = "CANCELLED";
        break;

      default:
        console.log(`[Webhook Asaas] Evento não tratado: ${evento}`);
        return NextResponse.json({ received: true });
    }

    // 5. Atualizar no banco
    const updatePayload: Record<string, unknown> = { statusPlano: novoStatus, ...updateData };
    await bd
      .update(negocios)
      .set(updatePayload)
      .where(eq(negocios.id, negocioDb.id));

    console.log(
      `[Webhook Asaas] Negócio "${negocioDb.nome}" → status: ${novoStatus}${updateData.plano ? ` | plano: ${updateData.plano}` : ""}`
    );

    return NextResponse.json({ received: true, status: novoStatus });
  } catch (error: any) {
    console.error("[Webhook Asaas] Erro fatal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
