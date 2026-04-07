/**
 * Controle de acesso por plano — LocalSEO v2.
 *
 * Define os limites de cada funcionalidade por plano,
 * garantindo que features premium ficam travadas para quem não paga.
 *
 * Planos v2:
 *   STARTER (R$97) → GMB básico (posts + reviews + perfil + score)
 *   PRO (R$197) → + Site/Subdomínio + Blog SEO + Landing Pages + NAP
 *   PRO_PLUS (R$297) → + Search Console + Rank Tracking + Analytics + Relatórios avançados
 */

import { PlanoAssinatura } from "@/types";

export interface AcessoPlano {
  /** Nº máximo de posts por semana */
  postsSemanais: number;
  /** Pode usar o gerador de artigos SEO/Blog? */
  blogLiberado: boolean;
  /** Nº máximo de artigos por mês (Infinity = ilimitado) */
  artigosMaxMes: number;
  /** Pode usar o construtor de site IA? */
  siteLiberado: boolean;
  /** Pode criar/gerenciar landing pages? */
  landingPagesLiberado: boolean;
  /** Nº máximo de landing pages */
  maxLandingPages: number;
  /** Pode usar o verificador NAP? */
  napLiberado: boolean;
  /** Pode ver dados do Google Search Console? */
  searchConsoleLiberado: boolean;
  /** Pode ver Rank Tracking (posição no Google)? */
  rankTrackingLiberado: boolean;
  /** Pode acessar Analytics completo? */
  analyticsLiberado: boolean;
  /** Pode usar o pesquisador de palavras-chave IA? */
  palavrasChaveLiberado: boolean;
  /** Relatório semanal avançado por email? */
  relatorioAvancado: boolean;
  /** Suporte prioritário? */
  suportePrioritario: boolean;
  /** Número máximo de negócios */
  maxNegocios: number;
}

const ACESSO_POR_PLANO: Record<PlanoAssinatura, AcessoPlano> = {
  STARTER: {
    postsSemanais: 1,
    blogLiberado: false,
    artigosMaxMes: 0,
    siteLiberado: false,
    landingPagesLiberado: false,
    maxLandingPages: 0,
    napLiberado: false,
    searchConsoleLiberado: false,
    rankTrackingLiberado: false,
    analyticsLiberado: false,
    palavrasChaveLiberado: false,
    relatorioAvancado: false,
    suportePrioritario: false,
    maxNegocios: 1,
  },
  PRO: {
    postsSemanais: 2,
    blogLiberado: true,
    artigosMaxMes: 4,
    siteLiberado: true,
    landingPagesLiberado: true,
    maxLandingPages: 5,
    napLiberado: true,
    searchConsoleLiberado: false,
    rankTrackingLiberado: false,
    analyticsLiberado: false,
    palavrasChaveLiberado: true,
    relatorioAvancado: false,
    suportePrioritario: false,
    maxNegocios: 1,
  },
  PRO_PLUS: {
    postsSemanais: 4,
    blogLiberado: true,
    artigosMaxMes: Infinity,
    siteLiberado: true,
    landingPagesLiberado: true,
    maxLandingPages: 20,
    napLiberado: true,
    searchConsoleLiberado: true,
    rankTrackingLiberado: true,
    analyticsLiberado: true,
    palavrasChaveLiberado: true,
    relatorioAvancado: true,
    suportePrioritario: true,
    maxNegocios: 1,
  },
};

/**
 * Retorna as permissões de acesso de acordo com o plano.
 */
export function getAcessoPlano(plano: PlanoAssinatura): AcessoPlano {
  return ACESSO_POR_PLANO[plano] ?? ACESSO_POR_PLANO.STARTER;
}

/**
 * Verifica se o plano dá acesso a uma feature específica.
 */
export function temAcesso(
  plano: PlanoAssinatura,
  feature: keyof AcessoPlano
): boolean {
  const acesso = getAcessoPlano(plano);
  const val = acesso[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}

/**
 * Retorna o nome amigável do plano para exibição na UI.
 */
export function getNomePlano(plano: PlanoAssinatura): string {
  const nomes: Record<PlanoAssinatura, string> = {
    STARTER: "Starter",
    PRO: "Pro",
    PRO_PLUS: "Pro+",
  };
  return nomes[plano] ?? "Starter";
}

/**
 * Retorna o preço mensal do plano.
 */
export function getPrecoPlano(plano: PlanoAssinatura): number {
  const precos: Record<PlanoAssinatura, number> = {
    STARTER: 97,
    PRO: 197,
    PRO_PLUS: 297,
  };
  return precos[plano] ?? 97;
}

/**
 * Identifica o plano mínimo necessário para uma feature.
 */
export function planoMinimo(feature: keyof AcessoPlano): PlanoAssinatura {
  if (temAcesso("STARTER", feature)) return "STARTER";
  if (temAcesso("PRO", feature)) return "PRO";
  return "PRO_PLUS";
}
