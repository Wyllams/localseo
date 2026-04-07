/**
 * Componentes utilitários de SEO para landing pages.
 * Gera JSON-LD estruturado para LocalBusiness, Service, FAQPage e AggregateRating.
 */

export interface SeoLdProps {
  nomeNegocio: string;
  subdominio: string;
  categoria: string;
  cidade: string;
  estado?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  descricao?: string | null;
  // Landing page specific
  servicoFoco: string;
  slug: string;
  imagemDestaque?: string | null;
  whatsapp?: string | null;
  faq?: { pergunta: string; resposta: string }[] | null;
  // Reviews data
  avaliacoes?: { nota: number | null }[];
}

/**
 * Gera o JSON-LD completo para uma landing page de SEO local.
 * Inclui: LocalBusiness, Service, FAQPage, AggregateRating.
 */
export function gerarJsonLd(props: SeoLdProps): object[] {
  const baseUrl = `https://${props.subdominio}.localseo.com.br`;
  const pageUrl = `${baseUrl}/${props.slug}`;

  const schemas: object[] = [];

  // 1. LocalBusiness
  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": baseUrl,
    name: props.nomeNegocio,
    url: pageUrl,
    image: props.imagemDestaque || props.logoUrl || "",
    telephone: props.whatsapp || props.telefone || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: props.endereco || "",
      addressLocality: props.cidade,
      addressRegion: props.estado || "",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Coordenadas serão preenchidas quando tivermos geocoding
    },
    priceRange: "$$",
  };

  if (props.descricao) {
    localBusiness.description = props.descricao;
  }

  if (props.logoUrl) {
    localBusiness.logo = props.logoUrl;
  }

  // AggregateRating se há reviews
  if (props.avaliacoes && props.avaliacoes.length > 0) {
    const notasValidas = props.avaliacoes
      .filter((a) => a.nota !== null)
      .map((a) => a.nota as number);
    if (notasValidas.length > 0) {
      const media =
        notasValidas.reduce((sum, n) => sum + n, 0) / notasValidas.length;
      localBusiness.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: media.toFixed(1),
        bestRating: "5",
        worstRating: "1",
        ratingCount: notasValidas.length,
      };
    }
  }

  schemas.push(localBusiness);

  // 2. Service
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Service",
    name: props.servicoFoco,
    provider: {
      "@type": "LocalBusiness",
      name: props.nomeNegocio,
    },
    areaServed: {
      "@type": "City",
      name: props.cidade,
    },
    url: pageUrl,
  });

  // 3. FAQPage
  if (props.faq && props.faq.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: props.faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.resposta,
        },
      })),
    });
  }

  // 4. BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: props.nomeNegocio,
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: props.servicoFoco,
        item: pageUrl,
      },
    ],
  });

  return schemas;
}

/**
 * Gera metadata SEO completa para Next.js generateMetadata.
 */
export function gerarMetadataSeo(opts: {
  titulo: string;
  descricao: string;
  url: string;
  imagem?: string | null;
  noIndex?: boolean;
}) {
  return {
    title: opts.titulo,
    description: opts.descricao,
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: opts.titulo,
      description: opts.descricao,
      url: opts.url,
      type: "website",
      locale: "pt_BR",
      ...(opts.imagem && {
        images: [{ url: opts.imagem, width: 1200, height: 630, alt: opts.titulo }],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: opts.titulo,
      description: opts.descricao,
      ...(opts.imagem && { images: [opts.imagem] }),
    },
    alternates: {
      canonical: opts.url,
    },
  };
}
