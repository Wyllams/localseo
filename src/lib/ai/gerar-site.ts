/**
 * Gerador de conteúdo textual para Landing Pages via Gemini AI.
 *
 * Recebe o contexto do negócio (preenchido pelo formulário de setup)
 * e retorna headline + subtítulo + FAQ persuasivos, otimizados para SEO local.
 *
 * @module lib/ai/gerar-site
 */

interface ContextoSite {
  nomeNegocio: string;
  nicho: string;
  servicoFoco: string;
  servicos: string[];
  diferencial: string;
  tomVoz: "profissional" | "descontraido" | "agressivo";
  cidade: string;
  estado?: string | null;
}

export interface FaqItem {
  pergunta: string;
  resposta: string;
}

export interface ConteudoGerado {
  headline: string;
  subtitulo: string;
  termoImagem: string;
  faq: FaqItem[];
  metaTitle: string;
  metaDescription: string;
}

/**
 * Gera conteúdo de alta conversão para uma Landing Page de negócio local.
 * Usa a Gemini API diretamente via fetch.
 */
export async function gerarConteudoSite(
  contexto: ContextoSite
): Promise<ConteudoGerado> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY não configurada. Usando fallback.");
    return gerarFallback(contexto);
  }

  const tomDescricao = {
    profissional: "formal, confiável, autoritário e sóbrio",
    descontraido: "amigável, caloroso, próximo do cliente, leve e acolhedor",
    agressivo: "urgente, comercial, com senso de escassez e chamadas fortes de ação",
  };

  const prompt = `Você é um copywriter profissional especialista em funis de venda e SEO local para negócios brasileiros.

Crie o conteúdo textual para uma Landing Page de alta conversão, desenhada para vender UM ÚNICO SERVIÇO, com as seguintes informações:

NEGÓCIO: ${contexto.nomeNegocio}
NICHO: ${contexto.nicho}
SERVIÇO FOCO DA PÁGINA: ${contexto.servicoFoco}
CARACTERÍSTICAS / INCLUSO NO SERVIÇO: ${contexto.servicos.join(", ")}
DIFERENCIAL COMPETITIVO: ${contexto.diferencial}
CIDADE: ${contexto.cidade}${contexto.estado ? ` - ${contexto.estado}` : ""}
TOM DE VOZ: ${tomDescricao[contexto.tomVoz]}

REGRAS ESTRITAS:
1. A "headline" deve focar 100% no SERVIÇO FOCO. Ter no MÁXIMO 70 caracteres, ser impactante e desejavelmente conter a cidade.
2. O "subtitulo" deve ter entre 100 e 200 caracteres, vender o serviço foco e reforçar o diferencial.
3. "termoImagem": 1-2 palavras em INGLÊS que representem visualmente ESTE SERVIÇO para busca no Unsplash.
4. "faq": um array de 4 a 5 perguntas frequentes sobre o serviço foco. Cada item tem "pergunta" e "resposta". As perguntas devem ser naturais, como as que um cliente real faria. As respostas devem ser informativas, otimizadas para SEO local, e mencionar o nome do negócio e a cidade quando apropriado.
5. "metaTitle": título SEO (máx 60 chars) no formato: "Serviço Foco em Cidade | Nome do Negócio"
6. "metaDescription": meta description (máx 155 chars) persuasiva, com call to action

Responda EXATAMENTE no formato JSON abaixo, sem markdown:
{"headline": "...", "subtitulo": "...", "termoImagem": "...", "faq": [{"pergunta": "...", "resposta": "..."}], "metaTitle": "...", "metaDescription": "..."}`;

  try {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!resposta.ok) {
      console.error("Gemini API erro:", resposta.status);
      return gerarFallback(contexto);
    }

    const dados = await resposta.json();
    const textoResposta =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extrair JSON da resposta (pode vir com ```json ... ```)
    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validação defensiva
      if (parsed.headline && parsed.subtitulo) {
        return {
          headline: parsed.headline.substring(0, 500),
          subtitulo: parsed.subtitulo.substring(0, 2000),
          termoImagem: parsed.termoImagem ? parsed.termoImagem.substring(0, 50) : "business",
          faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 6) : gerarFaqFallback(contexto),
          metaTitle: parsed.metaTitle ? parsed.metaTitle.substring(0, 70) : `${contexto.servicoFoco} em ${contexto.cidade} | ${contexto.nomeNegocio}`,
          metaDescription: parsed.metaDescription ? parsed.metaDescription.substring(0, 160) : `Procurando ${contexto.servicoFoco} em ${contexto.cidade}? ${contexto.nomeNegocio} oferece o melhor atendimento. Agende agora!`,
        };
      }
    }

    console.warn("Gemini retornou formato inesperado, usando fallback.");
    return gerarFallback(contexto);
  } catch (erro) {
    console.error("Erro ao chamar Gemini:", erro);
    return gerarFallback(contexto);
  }
}

/**
 * Gera FAQ determinístico para fallback.
 */
function gerarFaqFallback(contexto: ContextoSite): FaqItem[] {
  return [
    {
      pergunta: `O que é o serviço de ${contexto.servicoFoco}?`,
      resposta: `O serviço de ${contexto.servicoFoco} oferecido pela ${contexto.nomeNegocio} é projetado para atender suas necessidades com máxima qualidade e profissionalismo em ${contexto.cidade}.`,
    },
    {
      pergunta: `Quanto tempo leva o ${contexto.servicoFoco}?`,
      resposta: `O tempo pode variar de acordo com cada caso. Na ${contexto.nomeNegocio}, priorizamos a qualidade e fazemos uma avaliação personalizada antes de iniciar qualquer procedimento.`,
    },
    {
      pergunta: `Qual é o preço do ${contexto.servicoFoco}?`,
      resposta: `Os valores variam conforme a complexidade de cada caso. Entre em contato com a ${contexto.nomeNegocio} para uma avaliação gratuita e orçamento personalizado.`,
    },
    {
      pergunta: `Por que escolher a ${contexto.nomeNegocio} para ${contexto.servicoFoco}?`,
      resposta: `${contexto.diferencial || `Somos referência em ${contexto.nicho} em ${contexto.cidade}`}. Nossa equipe é altamente qualificada e focada em resultados excepcionais para cada cliente.`,
    },
  ];
}

/**
 * Fallback determinístico caso a API esteja indisponível.
 */
function gerarFallback(contexto: ContextoSite): ConteudoGerado {
  return {
    headline: `Melhor ${contexto.servicoFoco} em ${contexto.cidade}`,
    subtitulo: `Especialistas em ${contexto.servicoFoco}. ${contexto.diferencial}. Atendemos em ${contexto.cidade}${contexto.estado ? ` - ${contexto.estado}` : ""} oferecendo o melhor resultado para você.`,
    termoImagem: "business service",
    faq: gerarFaqFallback(contexto),
    metaTitle: `${contexto.servicoFoco} em ${contexto.cidade} | ${contexto.nomeNegocio}`,
    metaDescription: `Procurando ${contexto.servicoFoco} em ${contexto.cidade}? ${contexto.nomeNegocio} oferece atendimento de qualidade. Agende agora!`,
  };
}
