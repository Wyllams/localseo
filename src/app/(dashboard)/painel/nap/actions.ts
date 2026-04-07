"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, verificacoesNap } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verificarNap, type ResultadoNAPCompleto } from "@/lib/agents/verificador-nap";

export async function executarVerificacaoNAP(): Promise<{
  sucesso: boolean;
  resultado?: ResultadoNAPCompleto;
  erro?: string;
}> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    const resultado = await verificarNap(negocioDb.id);

    revalidatePath("/painel/nap");

    return { sucesso: true, resultado };
  } catch (erro) {
    console.error("[NAP Action] Erro:", erro);
    return { sucesso: false, erro: "Erro ao executar verificação NAP." };
  }
}

export async function limparHistoricoNAP(): Promise<{ sucesso: boolean }> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false };

    await bd.delete(verificacoesNap).where(eq(verificacoesNap.negocioId, negocioDb.id));

    revalidatePath("/painel/nap");
    return { sucesso: true };
  } catch {
    return { sucesso: false };
  }
}
