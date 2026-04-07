"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, palavrasChaveNegocio } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

export async function adicionarKeyword(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioDb) return;

  const kw = formData.get("keyword") as string;
  const tipo = (formData.get("tipo") as string) || "PRIMARY";
  if (!kw || kw.trim().length < 2) return;

  await bd.insert(palavrasChaveNegocio).values({
    negocioId: negocioDb.id,
    palavraChave: kw.trim().toLowerCase(),
    tipo: tipo as "PRIMARY" | "SECONDARY" | "LONG_TAIL" | "INFORMATIONAL" | "TRANSACTIONAL",
  });

  revalidatePath("/painel/palavras-chave");
}

export async function excluirKeyword(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioDb) return;

  const id = formData.get("id") as string;
  if (!id) return;

  await bd.delete(palavrasChaveNegocio).where(eq(palavrasChaveNegocio.id, id));
  revalidatePath("/painel/palavras-chave");
}

export async function gerarSugestoesIA(): Promise<{
  sucesso: boolean;
  sugestoes?: { palavra: string; tipo: string; motivo: string }[];
  erro?: string;
}> {
  try {
    const sessao = await auth.api.getSession({ headers: await headers() });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });
    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // Mock
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
      await new Promise((r) => setTimeout(r, 1500));
      return {
        sucesso: true,
        sugestoes: [
          { palavra: `${negocioDb.categoria.toLowerCase()} ${negocioDb.cidade.toLowerCase()}`, tipo: "PRIMARY", motivo: "Busca local direta com alto volume" },
          { palavra: `melhor ${negocioDb.categoria.toLowerCase()} perto de mim`, tipo: "TRANSACTIONAL", motivo: "Intenção de compra imediata" },
          { palavra: `como escolher ${negocioDb.categoria.toLowerCase()}`, tipo: "INFORMATIONAL", motivo: "Top de funil, atrai tráfego qualificado" },
          { palavra: `${negocioDb.categoria.toLowerCase()} ${negocioDb.cidade.toLowerCase()} preço`, tipo: "TRANSACTIONAL", motivo: "Intenção comercial forte" },
          { palavra: `${negocioDb.categoria.toLowerCase()} confiável ${negocioDb.cidade.toLowerCase()}`, tipo: "LONG_TAIL", motivo: "Long tail com baixa concorrência" },
          { palavra: `dicas de ${negocioDb.categoria.toLowerCase()}`, tipo: "INFORMATIONAL", motivo: "Conteúdo educativo para blog" },
        ],
      };
    }

    const existentes = await bd.query.palavrasChaveNegocio.findMany({
      where: eq(palavrasChaveNegocio.negocioId, negocioDb.id),
      columns: { palavraChave: true },
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sugestoes: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  palavra: { type: SchemaType.STRING },
                  tipo: { type: SchemaType.STRING },
                  motivo: { type: SchemaType.STRING },
                },
                required: ["palavra", "tipo", "motivo"],
              },
            },
          },
          required: ["sugestoes"],
        },
      },
    });

    const prompt = `Você é um especialista em SEO Local no Brasil. Gere 6 sugestões de palavras-chave para este negócio:
Negócio: ${negocioDb.nome}
Categoria: ${negocioDb.categoria}
Cidade: ${negocioDb.cidade}${negocioDb.estado ? `, ${negocioDb.estado}` : ""}

Palavras-chave já usadas (NÃO repita): ${existentes.map((e) => e.palavraChave).join(", ") || "nenhuma"}

Para cada sugestão, defina:
- palavra: a keyword em português, lowercase
- tipo: PRIMARY, SECONDARY, LONG_TAIL, INFORMATIONAL ou TRANSACTIONAL
- motivo: breve justificativa de por que é uma boa keyword (máx 50 chars)

Foque em: intenção local, baixa concorrência, alto valor para o negócio.`;

    const resultado = await model.generateContent(prompt);
    const parsed = JSON.parse(resultado.response.text());

    return { sucesso: true, sugestoes: parsed.sugestoes };
  } catch (erro) {
    console.error("[Keywords IA] Erro:", erro);
    return { sucesso: false, erro: "Erro ao gerar sugestões." };
  }
}
