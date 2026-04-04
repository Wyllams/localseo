import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

/**
 * Interface estrita de saída da IA.
 * Garante que a IA responda exatamente neste formato JSON.
 */
const schemaRespostaAvaliacao = z.object({
  sentimento: z.enum(["POSITIVO", "NEGATIVO", "NEUTRO"]).describe("O sentimento geral detectado na avaliação."),
  resposta_sugerida: z.string().describe("A resposta educada, profissional e otimizada elaborada pela IA."),
});

type ResultadoAvaliacao = z.infer<typeof schemaRespostaAvaliacao>;

interface ParamsAgente {
  nota: number;
  texto: string;
  nomeCliente: string;
  nomeNegocio: string;
  categoriaNegocio: string;
}

/**
 * Agente de Avaliações (Gemini)
 * Lê os dados da avaliação e elabora uma resposta cordial e com palavras-chave de SEO Local.
 */
export async function analisarEResponderAvaliacao(params: ParamsAgente): Promise<ResultadoAvaliacao> {
  // Se não tem chave de API configurada, retorna um Mock estático para testar a UI
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
    // delay falso
    await new Promise((res) => setTimeout(res, 1500));
    
    const sentimentoMock = params.nota >= 4 ? "POSITIVO" : params.nota === 3 ? "NEUTRO" : "NEGATIVO";
    const desculpa = sentimentoMock === "NEGATIVO" ? " Lamentamos que sua experiência não tenha sido a ideal, entraremos em contato." : "";
    
    return {
      sentimento: sentimentoMock,
      resposta_sugerida: `Olá ${params.nomeCliente}! Muito obrigado pela avaliação de ${params.nota} estrelas para nosso ${params.categoriaNegocio} (${params.nomeNegocio}).${desculpa} Esperamos vê-lo novamente em breve.`,
    };
  }

  const systemPrompt = `Você é um robô assistente especializado em SEO Local e Relações Públicas.
Seu objetivo é analisar uma avaliação que um cliente deixou no Google Meu Negócio e gerar uma resposta perfeita.
Regras da resposta:
- Tom profissional, cortês e acolhedor.
- Se for crítica (nota baixa), seja compreensivo e ofereça resolução. Não brigue com o cliente.
- Se for positivo, agradeça e convide a voltar.
- INCLUA o nome do negócio e a categoria de forma sutil na resposta para ajudar no SEO (ex: "Aqui na [Barbearia X] ficamos felizes...").`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-pro",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sentimento: {
              type: SchemaType.STRING,
              description: "O sentimento da avaliação do cliente (DEVE SER EXATAMENTE UM DE: POSITIVO, NEGATIVO, NEUTRO)",
            },
            resposta_sugerida: {
              type: SchemaType.STRING,
              description: "A resposta elaborada que será postada publicamente"
            }
          },
          required: ["sentimento", "resposta_sugerida"]
        }
      }
    });

    const promptUser = `Negócio: ${params.nomeNegocio}\nCategoria: ${params.categoriaNegocio}\nCliente: ${params.nomeCliente}\nNota: ${params.nota}/5\nComentário: "${params.texto}"`;

    const result = await model.generateContent(promptUser);
    const textoJson = result.response.text();
    
    // Parseia o retorno 
    const dataOutput = JSON.parse(textoJson);
    
    // Garante tipagem com zod
    return schemaRespostaAvaliacao.parse(dataOutput);

  } catch (erro) {
    console.error("[Agente Avaliacoes] Erro Gemini:", erro);
    throw erro;
  }
}
