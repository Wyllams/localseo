/**
 * Gerador de conteúdo textual para Landing Pages via Gemini AI.
 *
 * Recebe o contexto do negócio (preenchido pelo formulário de setup)
 * e retorna headline + subtítulo persuasivos, otimizados para SEO local.
 *
 * @module lib/ai/gerar-site
 */

interface ContextoSite {
  nomeNegocio: string;
  nicho: string;
  servicos: string[];
  diferencial: string;
  tomVoz: "profissional" | "descontraido" | "agressivo";
  cidade: string;
  estado?: string | null;
}

interface ConteudoGerado {
  headline: string;
  subtitulo: string;
  termoImagem: string; // Termo em inglês focado para Unsplash
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

  const prompt = `Você é um copywriter profissional especialista em negócios locais brasileiros.

Crie o conteúdo textual para uma Landing Page de alta conversão com as seguintes informações:

NEGÓCIO: ${contexto.nomeNegocio}
NICHO: ${contexto.nicho}
CIDADE: ${contexto.cidade}${contexto.estado ? ` - ${contexto.estado}` : ""}
SERVIÇOS PRINCIPAIS: ${contexto.servicos.join(", ")}
DIFERENCIAL: ${contexto.diferencial}
TOM DE VOZ: ${tomDescricao[contexto.tomVoz]}

REGRAS:
1. A headline deve ter no MÁXIMO 60 caracteres, ser impactante e conter a cidade.
2. O subtítulo deve ter entre 100 e 200 caracteres, explicar o que o negócio faz e reforçar o diferencial.
3. Forneça o "termoImagem": 1 ou 2 palavras cruciais em INGLÊS que representem visualmente o nicho para busca numa galeria de fotos (Unsplash). Ex: se For barbearia: "barbershop", clinica: "doctor clinic", software: "technology code", hamburgueria: "burger".
4. Responda EXATAMENTE no formato JSON abaixo, sem markdown, sem código, apenas o JSON puro:
{"headline": "...", "subtitulo": "...", "termoImagem": "..."}`;

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
            maxOutputTokens: 256,
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
    const jsonMatch = textoResposta.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ConteudoGerado;

      // Validação defensiva
      if (parsed.headline && parsed.subtitulo) {
        return {
          headline: parsed.headline.substring(0, 500),
          subtitulo: parsed.subtitulo.substring(0, 2000),
          termoImagem: parsed.termoImagem ? parsed.termoImagem.substring(0, 50) : "business",
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
 * Fallback determinístico caso a API esteja indisponível.
 * Gera textos genéricos mas coerentes com o contexto.
 */
function gerarFallback(contexto: ContextoSite): ConteudoGerado {
  const servicosPrincipais = contexto.servicos.slice(0, 3).join(", ");
  
  return {
    headline: `${contexto.nomeNegocio} — Referência em ${contexto.cidade}`,
    subtitulo: `Especialistas em ${servicosPrincipais}. ${contexto.diferencial}. Atendemos em ${contexto.cidade}${contexto.estado ? ` - ${contexto.estado}` : ""} com excelência e dedicação total.`,
    termoImagem: "business office",
  };
}
