import { notFound } from "next/navigation";
import { bd } from "@/db";
import { negocios, postagens, artigos, avaliacoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  MapPin,
  Phone,
  Globe,
  Star,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { formatarData } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slugNegocio: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slugNegocio } = await params;
  const negocio = await bd.query.negocios.findFirst({
    where: eq(negocios.subdominio, slugNegocio),
  });

  if (!negocio) return { title: "Não Encontrado" };

  return {
    title:
      negocio.siteHeadline ||
      `${negocio.nome} - Especialista em ${negocio.categoria}`,
    description:
      negocio.siteSubtitulo ||
      negocio.descricao ||
      `Bem-vindo ao site oficial da ${negocio.nome}. Saiba mais sobre nossos serviços.`,
  };
}

export default async function LandingPageNegocio({ params }: PageProps) {
  const { slugNegocio } = await params;

  // Busca negócio pelo subdomínio (slug)
  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.subdominio, slugNegocio),
    with: {
      postagens: {
        orderBy: [desc(postagens.criadoEm)],
        limit: 3,
      },
      artigos: {
        orderBy: [desc(artigos.criadoEm)],
        limit: 4,
      },
      avaliacoes: {
        orderBy: [desc(avaliacoes.criadoEm)],
        limit: 6,
      },
    },
  });

  if (!negocioDb) {
    notFound();
  }

  // Se o site não está ativo, retornar 404
  if (!negocioDb.siteAtivo) {
    notFound();
  }

  const servicos = (negocioDb.siteServicos as string[] | null) ?? [];
  const temWhatsapp = !!negocioDb.siteWhatsapp;
  const whatsappLink = temWhatsapp
    ? `https://wa.me/55${negocioDb.siteWhatsapp?.replace(/\D/g, "")}`
    : null;

  // Montagem do JSON-LD para indexação ultra rápida (LocalBusiness Schema)
  const schemaLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: negocioDb.nome,
    image: negocioDb.logoUrl || "",
    url: `https://${negocioDb.subdominio}.localseo.com.br`,
    telephone: negocioDb.telefone,
    address: {
      "@type": "PostalAddress",
      addressLocality: negocioDb.cidade,
      addressRegion: negocioDb.estado,
      addressCountry: "BR",
    },
    priceRange: "$$",
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Schema Markup Injection para Crawler do Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLd) }}
      />

      {/* --- HERO SECTION --- */}
      <header className="relative w-full py-24 sm:py-32 overflow-hidden border-b border-border/50 bg-gradient-to-b from-primary/5 to-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-primary/20 p-2 overflow-hidden">
            {negocioDb.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocioDb.logoUrl}
                alt={`Logo ${negocioDb.nome}`}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-4xl font-black text-primary">
                {negocioDb.nome.charAt(0)}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Star className="w-3.5 h-3.5" /> Destaque Local
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            {negocioDb.siteHeadline || negocioDb.nome}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            {negocioDb.siteSubtitulo ||
              negocioDb.descricao ||
              `Especialistas premium do setor de ${negocioDb.categoria} na região.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10">
            {/* CTA Principal — WhatsApp */}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm font-bold px-8 py-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                Agendar pelo WhatsApp
              </a>
            )}
            {negocioDb.telefone && (
              <a
                href={`tel:${negocioDb.telefone}`}
                className="flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" /> Ligar Agora
              </a>
            )}
            <div className="flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-xl bg-muted/50 border border-border">
              <MapPin className="w-4 h-4 text-primary" />
              {negocioDb.cidade} - {negocioDb.estado}
            </div>
          </div>
        </div>
      </header>

      {/* --- SEÇÃO DE SERVIÇOS --- */}
      {servicos.length > 0 && (
        <section className="py-20 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-center">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground text-center mb-12 text-lg max-w-2xl mx-auto">
              Conheça o que oferecemos para transformar sua experiência.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicos.map((servico, i) => (
                <div
                  key={i}
                  className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {servico}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Profissionais qualificados para garantir o melhor resultado.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- DIFERENCIAL --- */}
      {negocioDb.siteDiferencial && (
        <section className="py-20 bg-primary/5 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6 tracking-tight">
              Por Que Nos Escolher?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {negocioDb.siteDiferencial}
            </p>
          </div>
        </section>
      )}

      {/* --- CORTINA DE IMAGENS GMB GERADAS --- */}
      {negocioDb.postagens.length > 0 && (
        <section className="py-20 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              Novidades e Eventos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {negocioDb.postagens.map((post: any) => (
                <div
                  key={post.id}
                  className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  {post.imagemUrl && (
                    <div className="w-full h-48 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.imagemUrl}
                        alt="Novidade do local"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold uppercase tracking-wide">
                        {post.tipo}
                      </div>
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm font-medium text-foreground line-clamp-4 leading-relaxed mb-4 flex-1">
                      {post.conteudo}
                    </p>
                    <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                      Via Google Meu Negócio
                      <span>{formatarData(post.criadoEm)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- AVALIAÇÕES --- */}
      {negocioDb.avaliacoes && negocioDb.avaliacoes.length > 0 && (
        <section className="py-20 bg-muted/10 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-center">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-muted-foreground text-center mb-12 text-lg">
              Avaliações reais de quem já conhece nosso trabalho.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {negocioDb.avaliacoes.map((avaliacao: any) => (
                <div
                  key={avaliacao.id}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (avaliacao.nota ?? 5)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 mb-4">
                    &ldquo;{avaliacao.texto || "Excelente serviço!"}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    — {avaliacao.autor || "Cliente"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- PORTAL DE ARTIGOS (SEO) --- */}
      {negocioDb.artigos.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">
              Conteúdos Especiais
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl text-lg">
              Aprenda mais conosco através de nossos guias e orientações
              profissionais.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {negocioDb.artigos.map((art: any) => (
                <Link
                  href={`/blog/${art.slug}`}
                  key={art.id}
                  className="flex flex-col group border-b sm:border-b-0 sm:border-r border-border sm:pr-6 sm:last:border-r-0 pb-6 sm:pb-0 last:pb-0"
                >
                  {art.imagemHero && (
                    <div className="w-full h-32 rounded-xl bg-muted overflow-hidden mb-4 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.imagemHero}
                        alt={art.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-2 line-clamp-2 leading-tight">
                    {art.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-1">
                    {art.metaDescricao}
                  </p>
                  <span className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ler artigo <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- CTA FINAL --- */}
      {whatsappLink && (
        <section className="py-20 bg-gradient-to-r from-primary/10 to-emerald-500/10 border-t border-border/40">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">
              Pronto para Começar?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Entre em contato agora e agende gratuitamente.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 font-bold px-10 py-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 text-lg"
            >
              <MessageCircle className="w-6 h-6" />
              Falar no WhatsApp
            </a>
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-sm text-muted-foreground bg-muted/30 border-t border-border">
        <p>
          Desenvolvido com ⚡ por{" "}
          <span className="font-bold text-foreground">LocalSEO AI</span>
        </p>
      </footer>
    </div>
  );
}
