/**
 * Geradores de Schema Markup (JSON-LD) para SEO.
 *
 * Cria structured data válida conforme Schema.org para:
 * - LocalBusiness (negócio local)
 * - Article (artigos do blog)
 * - FAQPage (perguntas frequentes)
 * - BreadcrumbList (navegação)
 * - WebSite (site principal)
 *
 * @see https://schema.org
 * @see https://developers.google.com/search/docs/advanced/structured-data
 */

import type { FaqItem } from "@/types";

/* ===== LocalBusiness Schema ===== */

interface LocalBusinessParams {
  nome: string;
  categoria: string;
  cidade: string;
  estado?: string;
  endereco?: string;
  telefone?: string;
  website?: string;
  descricao?: string;
  logoUrl?: string;
  rating?: number;
  totalReviews?: number;
}

export function gerarSchemaLocalBusiness(params: LocalBusinessParams) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: params.nome,
    description: params.descricao || `${params.nome} - ${params.categoria} em ${params.cidade}`,
    image: params.logoUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: params.cidade,
      addressRegion: params.estado,
      streetAddress: params.endereco,
      addressCountry: "BR",
    },
  };

  if (params.telefone) {
    schema.telephone = params.telefone;
  }

  if (params.website) {
    schema.url = params.website;
  }

  if (params.rating && params.totalReviews) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: params.rating.toFixed(1),
      reviewCount: params.totalReviews,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Mapear categoria para tipo mais específico
  const tipoMap: Record<string, string> = {
    RESTAURANTE: "Restaurant",
    BARBEARIA: "BarberShop",
    SALAO_DE_BELEZA: "BeautySalon",
    CLINICA: "MedicalBusiness",
    FARMACIA: "Pharmacy",
    ACADEMIA: "SportsActivityLocation",
    PET_SHOP: "PetStore",
    LOJA: "Store",
    EDUCACAO: "EducationalOrganization",
  };

  if (tipoMap[params.categoria]) {
    schema["@type"] = tipoMap[params.categoria];
  }

  return schema;
}

/* ===== Article Schema ===== */

interface ArticleParams {
  titulo: string;
  descricao: string;
  palavraChave: string;
  imagemUrl?: string;
  url: string;
  autorNome: string;
  dataPublicacao: string; // ISO 8601
  dataModificacao?: string;
  nomePublicador: string;
  logoPublicador?: string;
  wordCount?: number;
}

export function gerarSchemaArticle(params: ArticleParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.titulo,
    description: params.descricao,
    keywords: params.palavraChave,
    image: params.imagemUrl,
    url: params.url,
    wordCount: params.wordCount,
    author: {
      "@type": "Person",
      name: params.autorNome,
    },
    publisher: {
      "@type": "Organization",
      name: params.nomePublicador,
      logo: params.logoPublicador
        ? {
            "@type": "ImageObject",
            url: params.logoPublicador,
          }
        : undefined,
    },
    datePublished: params.dataPublicacao,
    dateModified: params.dataModificacao ?? params.dataPublicacao,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  };
}

/* ===== FAQPage Schema ===== */

export function gerarSchemaFAQ(faqs: FaqItem[]) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/* ===== BreadcrumbList Schema ===== */

interface BreadcrumbItem {
  nome: string;
  url: string;
}

export function gerarSchemaBreadcrumb(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.nome,
      item: item.url,
    })),
  };
}

/* ===== WebSite Schema ===== */

interface WebSiteParams {
  nome: string;
  url: string;
  descricao?: string;
}

export function gerarSchemaWebSite(params: WebSiteParams) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: params.nome,
    url: params.url,
    description: params.descricao,
    potentialAction: {
      "@type": "SearchAction",
      target: `${params.url}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/* ===== Helper: Renderizar múltiplos schemas ===== */

/**
 * Combina múltiplos schemas em um array JSON-LD.
 * Usado no <head> das páginas.
 */
export function renderSchemas(...schemas: (Record<string, unknown> | null | undefined)[]): string {
  const validos = schemas.filter(Boolean);
  if (validos.length === 0) return "";

  if (validos.length === 1) {
    return JSON.stringify(validos[0]);
  }

  return JSON.stringify(validos);
}
