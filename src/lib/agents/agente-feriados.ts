/**
 * Agente de Feriados — Consome Brasil API (gratuita) para alertar
 * sobre feriados nacionais que podem afetar horários de funcionamento.
 * 
 * API: https://brasilapi.com.br/api/feriados/v1/{ano}
 */

export interface Feriado {
  date: string;       // "2026-01-01"
  name: string;       // "Confraternização mundial"
  type: string;       // "national"
}

export interface FeriadoFormatado {
  data: string;
  dataFormatada: string;
  nome: string;
  tipo: string;
  diasRestantes: number;
  proximidade: "HOJE" | "AMANHA" | "ESTA_SEMANA" | "PROXIMO" | "FUTURO";
}

const CACHE_FERIADOS = new Map<number, { data: Feriado[]; timestamp: number }>();
const CACHE_DURACAO_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Busca feriados nacionais do ano via Brasil API (com cache de 24h).
 */
export async function buscarFeriados(ano: number): Promise<Feriado[]> {
  // Verificar cache
  const cached = CACHE_FERIADOS.get(ano);
  if (cached && Date.now() - cached.timestamp < CACHE_DURACAO_MS) {
    return cached.data;
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
      next: { revalidate: 86400 }, // Cache 24h no Next.js
    });

    if (!response.ok) {
      throw new Error(`Brasil API retornou ${response.status}`);
    }

    const feriados: Feriado[] = await response.json();

    // Salvar no cache
    CACHE_FERIADOS.set(ano, { data: feriados, timestamp: Date.now() });

    return feriados;
  } catch (error) {
    console.error("[Agente Feriados] Erro ao buscar feriados:", error);
    return [];
  }
}

/**
 * Retorna os próximos feriados formatados com informações de proximidade.
 */
export async function obterProximosFeriados(limite: number = 5): Promise<FeriadoFormatado[]> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const anoAtual = hoje.getFullYear();

  // Buscar feriados deste ano e do próximo (para virada de ano)
  const [feriadosAnoAtual, feriadosProxAno] = await Promise.all([
    buscarFeriados(anoAtual),
    buscarFeriados(anoAtual + 1),
  ]);

  const todosFeriados = [...feriadosAnoAtual, ...feriadosProxAno];

  const feriadosFormatados: FeriadoFormatado[] = todosFeriados
    .map((f) => {
      const dataFeriado = new Date(f.date + "T00:00:00");
      const diffMs = dataFeriado.getTime() - hoje.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let proximidade: FeriadoFormatado["proximidade"] = "FUTURO";
      if (diasRestantes === 0) proximidade = "HOJE";
      else if (diasRestantes === 1) proximidade = "AMANHA";
      else if (diasRestantes <= 7) proximidade = "ESTA_SEMANA";
      else if (diasRestantes <= 30) proximidade = "PROXIMO";

      return {
        data: f.date,
        dataFormatada: dataFeriado.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        }),
        nome: f.name,
        tipo: f.type === "national" ? "Nacional" : "Estadual",
        diasRestantes,
        proximidade,
      };
    })
    .filter((f) => f.diasRestantes >= 0) // apenas futuros
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, limite);

  return feriadosFormatados;
}

/**
 * Verifica se há feriado nos próximos N dias.
 * Útil para alertas de horário especial.
 */
export async function temFeriadoProximo(dias: number = 3): Promise<FeriadoFormatado | null> {
  const proximos = await obterProximosFeriados(10);
  return proximos.find((f) => f.diasRestantes <= dias) || null;
}
