import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

const schemaBlocoConteudo = z.object({
  tag: z.enum(["h2", "h3", "p", "ul"]),
  conteudo: z.string(),
});

const schemaFaqItem = z.object({
  pergunta: z.string(),
  resposta: z.string(),
});

const schemaArtigoGerado = z.object({
  titulo: z.string(),
  metaDescricao: z.string(),
  palavraChave: z.string(),
  palavrasChaveSecundarias: z.array(z.string()),
  blocosDeConteudo: z.array(schemaBlocoConteudo),
  faq: z.array(schemaFaqItem),
  termo_busca_imagem: z.string(),
});

export type ResultadoArtigoBlog = z.infer<typeof schemaArtigoGerado>;

interface ParamsAgenteBlog {
  nomeNegocio: string;
  categoriaNegocio: string;
  temaSugestao: string;
  cidade?: string;
  artigosExistentes?: { titulo: string; slug: string }[];
}

export async function gerarArtigoBlogIA(params: ParamsAgenteBlog): Promise<ResultadoArtigoBlog> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
    await new Promise((res) => setTimeout(res, 2500));
    return {
      titulo: `Guia Completo sobre ${params.temaSugestao} na ${params.categoriaNegocio}`,
      metaDescricao: `Aprenda tudo sobre ${params.temaSugestao} e como a ${params.nomeNegocio} oferece os melhores serviços da região.`,
      palavraChave: params.temaSugestao,
      palavrasChaveSecundarias: ["Dicas", "Como funciona", params.categoriaNegocio, "Especialista"],
      termo_busca_imagem: "professional service",
      faq: [
        { pergunta: `O que é ${params.temaSugestao}?`, resposta: `${params.temaSugestao} é um tema importante para quem busca qualidade. Na ${params.nomeNegocio}, oferecemos o melhor atendimento da região.` },
        { pergunta: `Quanto custa ${params.temaSugestao}?`, resposta: `Os valores variam conforme cada caso. Entre em contato com a ${params.nomeNegocio} para um orçamento personalizado.` },
        { pergunta: `Onde encontrar ${params.temaSugestao}?`, resposta: `A ${params.nomeNegocio} atende em ${params.cidade || "sua cidade"}. Visite-nos para uma consulta.` },
      ],
      blocosDeConteudo: [
        { tag: "p", conteudo: `O tema "${params.temaSugestao}" é altamente relevante para quem busca os melhores serviços de ${params.categoriaNegocio}.` },
        { tag: "h2", conteudo: "Por que isso é tão importante?" },
        { tag: "p", conteudo: `Entender sobre ${params.temaSugestao} vai transformar sua experiência. A ${params.nomeNegocio} se preocupa em educar cada cliente sobre as melhores práticas do mercado.` },
        { tag: "h3", conteudo: "Benefícios Principais" },
        { tag: "ul", conteudo: "Maior conforto e satisfação|Qualidade de atendimento superior|Resultados visíveis em tempo recorde|Profissionais certificados e experientes" },
        { tag: "h2", conteudo: "Como Funciona na Prática?" },
        { tag: "p", conteudo: `Na ${params.nomeNegocio}, o processo de ${params.temaSugestao} segue etapas rigorosas de qualidade. Cada detalhe é pensado para garantir o melhor resultado possível.` },
        { tag: "h3", conteudo: "Passo a Passo do Atendimento" },
        { tag: "ul", conteudo: "Avaliação personalizada|Planejamento detalhado|Execução com técnica de ponta|Acompanhamento pós-serviço" },
        { tag: "h2", conteudo: "Conclusão" },
        { tag: "p", conteudo: `Esperamos que esse guia tenha esclarecido suas dúvidas sobre ${params.temaSugestao}. A equipe da ${params.nomeNegocio} está pronta para atendê-lo com excelência. Entre em contato agora mesmo!` },
      ],
    };
  }

  // Contexto de internal linking para artigos existentes
  const linkingContext = params.artigosExistentes && params.artigosExistentes.length > 0
    ? `\n\nARTIGOS EXISTENTES DO BLOG (para internal linking natural, mencione ao menos 1-2 quando relevante):
${params.artigosExistentes.map(a => `- "${a.titulo}" (slug: /blog/${a.slug})`).join("\n")}`
    : "";

  const systemPrompt = `Você é um Copywriter Sênior de SEO especialista em EEAT (Experiência, Especialidade, Autoridade e Confiança).
Você vai escrever um artigo longo para um pequeno negócio local brasileiro ranquear no Google.

Regras:
1. Crie um artigo LONGO e aprofundado (mínimo 8 blocos de conteúdo). Alterne parágrafos curtos, H2s lógicos, H3s e bullet points (use | para separar items em "ul").
2. Inclua a palavra-chave primária naturalmente: no título, na introdução e em pelo menos 1 subtítulo.
3. Crie 3-4 FAQs relevantes sobre o tema. As respostas devem ser completas e mencionar o negócio/cidade.
4. Finalize com CTA orgânico para o negócio.
5. Texto formal, amigável, PT-BR.
6. metaDescricao DEVE ter entre 120-155 caracteres e ser persuasiva.${linkingContext}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            titulo: { type: SchemaType.STRING },
            metaDescricao: { type: SchemaType.STRING },
            palavraChave: { type: SchemaType.STRING },
            palavrasChaveSecundarias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            termo_busca_imagem: { type: SchemaType.STRING },
            faq: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  pergunta: { type: SchemaType.STRING },
                  resposta: { type: SchemaType.STRING },
                },
                required: ["pergunta", "resposta"],
              },
            },
            blocosDeConteudo: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  tag: { type: SchemaType.STRING },
                  conteudo: { type: SchemaType.STRING },
                },
                required: ["tag", "conteudo"],
              },
            },
          },
          required: ["titulo", "metaDescricao", "palavraChave", "palavrasChaveSecundarias", "termo_busca_imagem", "blocosDeConteudo", "faq"],
        },
      },
    });

    const finalPrompt = `${systemPrompt}\n\nNegócio: ${params.nomeNegocio} (Categoria: ${params.categoriaNegocio})${params.cidade ? `, Cidade: ${params.cidade}` : ""}.\nTema/Sugestão de Artigo: ${params.temaSugestao}`;

    const resultado = await model.generateContent(finalPrompt);
    const textoJson = resultado.response.text();

    const objeto = JSON.parse(textoJson);
    return schemaArtigoGerado.parse(objeto);
  } catch (erro) {
    console.error("[Agente Blog] Erro Gemini:", erro);
    throw erro;
  }
}

/**
 * Calcula word count e reading time a partir dos blocos de conteúdo.
 */
export function calcularMetricasArtigo(blocos: { tag: string; conteudo: string }[]): { wordCount: number; readingTime: number } {
  const totalPalavras = blocos.reduce((total, bloco) => {
    return total + bloco.conteudo.split(/\s+/).filter(Boolean).length;
  }, 0);

  return {
    wordCount: totalPalavras,
    readingTime: Math.max(1, Math.ceil(totalPalavras / 200)),
  };
}
