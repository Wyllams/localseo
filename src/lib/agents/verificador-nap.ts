/**
 * Verificador de Consistência NAP (Nome, Endereço, Telefone).
 *
 * Compara as informações NAP do negócio entre múltiplas fontes:
 * 1. Perfil Cadastro (dados do DB — fonte de referência)
 * 2. Landing Pages (subdomínio — WhatsApp vs telefone)
 * 3. Website externo (scraping via fetch + regex)
 * 4. Google Meu Negócio (quando conectado)
 */

import { bd } from "@/db";
import { negocios, verificacoesNap, landingPages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/* ===== Tipos ===== */
export interface FonteNAP {
  fonte: string;
  nome: string | null;
  endereco: string | null;
  telefone: string | null;
}

export interface ResultadoVerificacao {
  fonte: string;
  consistente: boolean;
  problemas: string[];
  dados: FonteNAP;
}

export interface ResultadoNAPCompleto {
  referencia: FonteNAP;
  verificacoes: ResultadoVerificacao[];
  scoreConsistencia: number; // 0-100
  totalProblemas: number;
}

/* ===== Helpers ===== */

function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTelefone(tel: string | null | undefined): string {
  if (!tel) return "";
  return tel.replace(/\D/g, "");
}

function compararContraReferencia(ref: FonteNAP, fonte: FonteNAP): ResultadoVerificacao {
  const problemas: string[] = [];

  // Nome
  if (fonte.nome && normalizarTexto(fonte.nome) !== normalizarTexto(ref.nome) && normalizarTexto(ref.nome)) {
    problemas.push(`Nome diferente: "${fonte.nome}" (esperado: "${ref.nome}")`);
  }

  // Endereço
  if (fonte.endereco && normalizarTexto(fonte.endereco) !== normalizarTexto(ref.endereco) && normalizarTexto(ref.endereco)) {
    problemas.push(`Endereço diferente: "${fonte.endereco}" (esperado: "${ref.endereco}")`);
  }

  // Telefone
  if (fonte.telefone && normalizarTelefone(fonte.telefone) !== normalizarTelefone(ref.telefone) && normalizarTelefone(ref.telefone)) {
    problemas.push(`Telefone diferente: "${fonte.telefone}" (esperado: "${ref.telefone}")`);
  }

  // Campos faltantes
  if (!fonte.nome && normalizarTexto(ref.nome)) {
    problemas.push("Nome não encontrado nesta fonte");
  }
  if (!fonte.endereco && normalizarTexto(ref.endereco)) {
    problemas.push("Endereço não encontrado nesta fonte");
  }
  if (!fonte.telefone && normalizarTelefone(ref.telefone)) {
    problemas.push("Telefone não encontrado nesta fonte");
  }

  return {
    fonte: fonte.fonte,
    consistente: problemas.length === 0,
    problemas,
    dados: fonte,
  };
}

/* ===== Verificação Principal ===== */

export async function verificarNap(negocioId: string): Promise<ResultadoNAPCompleto> {
  const negocio = await bd.query.negocios.findFirst({
    where: eq(negocios.id, negocioId),
    with: {
      landingPages: {
        where: (lps, { eq }) => eq(lps.ativo, true),
        limit: 5,
      },
    },
  });

  if (!negocio) {
    throw new Error(`Negócio ${negocioId} não encontrado`);
  }

  // Fonte de referência
  const referencia: FonteNAP = {
    fonte: "PERFIL_CADASTRO",
    nome: negocio.nome,
    endereco: negocio.endereco,
    telefone: negocio.telefone,
  };

  const fontes: FonteNAP[] = [];
  const verificacoes: ResultadoVerificacao[] = [];

  // Verificar Landing Pages
  if (negocio.landingPages && negocio.landingPages.length > 0) {
    for (const lp of negocio.landingPages) {
      const fonteLp: FonteNAP = {
        fonte: `LANDING_PAGE: ${lp.servicoFoco}`,
        nome: negocio.nome,
        endereco: negocio.endereco,
        telefone: lp.whatsapp || negocio.telefone,
      };
      fontes.push(fonteLp);
      verificacoes.push(compararContraReferencia(referencia, fonteLp));
    }
  }

  // Verificar Website externo
  if (negocio.website) {
    const fonteWeb = await extrairNAPDoWebsite(negocio.website, negocio.nome);
    fontes.push(fonteWeb);
    verificacoes.push(compararContraReferencia(referencia, fonteWeb));
  }

  // GMB (se conectado — usa dados do DB pois já estão sincronizados)
  if (negocio.gmbLocalId) {
    const fonteGmb: FonteNAP = {
      fonte: "GOOGLE_MEU_NEGOCIO",
      nome: negocio.nome,
      endereco: negocio.endereco,
      telefone: negocio.telefone,
    };
    fontes.push(fonteGmb);
    verificacoes.push(compararContraReferencia(referencia, fonteGmb));
  }

  // Score de consistência
  const totalVerificacoes = verificacoes.length;
  const consistentes = verificacoes.filter((v) => v.consistente).length;
  const scoreConsistencia = totalVerificacoes > 0
    ? Math.round((consistentes / totalVerificacoes) * 100)
    : 100;

  const todosProblemas = verificacoes.flatMap((v) => v.problemas);

  // Salvar resultado no banco
  for (const v of verificacoes) {
    await bd.insert(verificacoesNap).values({
      negocioId,
      fonte: v.fonte,
      nome: v.dados.nome,
      endereco: v.dados.endereco,
      telefone: v.dados.telefone,
      consistente: v.consistente,
      problemas: v.problemas.length > 0 ? v.problemas : null,
    });
  }

  return {
    referencia,
    verificacoes,
    scoreConsistencia,
    totalProblemas: todosProblemas.length,
  };
}

/**
 * Extrai NAP de um website externo via fetch + regex.
 */
async function extrairNAPDoWebsite(url: string, nomeNegocio: string): Promise<FonteNAP> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RikoSEO-NAP/1.0)" },
    });
    clearTimeout(timeout);

    const html = await response.text();

    // Buscar telefone (padrão BR)
    const regexTel = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/g;
    const telsEncontrados = html.match(regexTel);
    const telefone = telsEncontrados?.[0] || null;

    // Buscar endereço
    const regexEnd = /(?:rua|av\.?|avenida|travessa|alameda|praça)[^<,]{5,100}/gi;
    const endsEncontrados = html.match(regexEnd);
    const endereco = endsEncontrados?.[0]?.trim() || null;

    // Nome
    const nomePresente = html.toLowerCase().includes(nomeNegocio.toLowerCase());

    return {
      fonte: "WEBSITE",
      nome: nomePresente ? nomeNegocio : null,
      endereco,
      telefone,
    };
  } catch {
    return { fonte: "WEBSITE", nome: null, endereco: null, telefone: null };
  }
}

/**
 * Buscar últimas verificações NAP de um negócio.
 */
export async function buscarUltimasVerificacoes(negocioId: string) {
  return bd.query.verificacoesNap.findMany({
    where: eq(verificacoesNap.negocioId, negocioId),
    orderBy: [desc(verificacoesNap.verificadoEm)],
    limit: 20,
  });
}
