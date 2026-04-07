/**
 * Google Suggest — Pesquisa de palavras-chave gratuita.
 *
 * Usa o Google Autocomplete (Suggest) para descobrir palavras-chave
 * reais que as pessoas digitam no Google.
 *
 * A classificação (tipo) da keyword é feita via heurísticas locais,
 * sem custo de API.
 *
 * MVP: Google Suggest → gratuito, sem API key
 * Futuro: DataForSEO → volume real, CPC, dificuldade
 */

import type { TipoPalavraChave } from "@/types";

/* ===== Tipos ===== */

export interface PalavraChaveSugerida {
  texto: string;
  tipo: TipoPalavraChave;
  volume?: number; // null no MVP (Suggest não retorna volume)
  dificuldade?: number; // null no MVP
}

/* ===== Interface abstrata (para futuro swap) ===== */

export interface KeywordService {
  pesquisar(
    semente: string,
    cidade?: string,
    limite?: number
  ): Promise<PalavraChaveSugerida[]>;
}

/* ===== Implementação: Google Suggest ===== */

/**
 * Busca sugestões do Google Autocomplete.
 * Gratuito, não precisa de API key.
 */
async function fetchGoogleSuggest(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 3600 }, // cache de 1h
    });

    if (!res.ok) {
      console.error(`[Google Suggest] Erro HTTP ${res.status}`);
      return [];
    }

    const body = await res.json();
    // O formato do Firefox suggest é: [query, [sugestões]]
    if (Array.isArray(body) && Array.isArray(body[1])) {
      return body[1] as string[];
    }

    return [];
  } catch (error) {
    console.error("[Google Suggest] Erro:", error);
    return [];
  }
}

/**
 * Classifica automaticamente o tipo da keyword usando heurísticas.
 */
function classificarKeyword(keyword: string): TipoPalavraChave {
  const lower = keyword.toLowerCase();
  const wordCount = keyword.split(/\s+/).length;

  // Palavras transacionais
  const transacionais = [
    "comprar",
    "preço",
    "promoção",
    "desconto",
    "agendar",
    "marcar",
    "contratar",
    "orçamento",
    "perto de mim",
    "delivery",
    "entrega",
    "aberto agora",
  ];

  if (transacionais.some((t) => lower.includes(t))) {
    return "TRANSACTIONAL";
  }

  // Palavras informacionais
  const informacionais = [
    "como",
    "o que é",
    "por que",
    "qual",
    "quando",
    "onde",
    "dicas",
    "guia",
    "tutorial",
    "passo a passo",
    "diferença entre",
  ];

  if (informacionais.some((t) => lower.includes(t))) {
    return "INFORMATIONAL";
  }

  // Long-tail: 4+ palavras
  if (wordCount >= 4) {
    return "LONG_TAIL";
  }

  // Secondary: 2-3 palavras
  if (wordCount >= 2) {
    return "SECONDARY";
  }

  return "PRIMARY";
}

/**
 * Implementação do KeywordService usando Google Suggest.
 */
export class GoogleSuggestService implements KeywordService {
  async pesquisar(
    semente: string,
    cidade?: string,
    limite = 20
  ): Promise<PalavraChaveSugerida[]> {
    const queries: string[] = [];

    // Variações de busca
    queries.push(semente);
    if (cidade) {
      queries.push(`${semente} ${cidade}`);
      queries.push(`${semente} em ${cidade}`);
    }

    // Prefixos comuns para expandir
    const prefixos = [
      "como",
      "melhor",
      "onde",
      "qual",
      "preço",
    ];
    for (const prefixo of prefixos) {
      queries.push(`${prefixo} ${semente}`);
    }

    // Sufixos geo-locais
    const sufixos = [
      "perto de mim",
      "aberto agora",
      "bom",
    ];
    for (const sufixo of sufixos) {
      queries.push(`${semente} ${sufixo}`);
    }

    // Buscar todas as variações em paralelo
    const todas = await Promise.all(
      queries.map((q) => fetchGoogleSuggest(q))
    );

    // Deduplica
    const setUnico = new Set<string>();
    const resultado: PalavraChaveSugerida[] = [];

    for (const lista of todas) {
      for (const kw of lista) {
        const normalizada = kw.toLowerCase().trim();
        if (!setUnico.has(normalizada) && normalizada.length > 2) {
          setUnico.add(normalizada);
          resultado.push({
            texto: kw,
            tipo: classificarKeyword(kw),
          });
        }
      }
    }

    // Ordenar: PRIMARY primeiro, depois TRANSACTIONAL, etc.
    const prioridade: Record<TipoPalavraChave, number> = {
      PRIMARY: 1,
      TRANSACTIONAL: 2,
      LONG_TAIL: 3,
      SECONDARY: 4,
      INFORMATIONAL: 5,
    };

    resultado.sort((a, b) => prioridade[a.tipo] - prioridade[b.tipo]);

    return resultado.slice(0, limite);
  }
}

/**
 * Singleton para uso global.
 */
export const keywordService: KeywordService = new GoogleSuggestService();
