import { notFound } from "next/navigation";
import { bd } from "@/db";
import { negocios, postagens, artigos, avaliacoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  MapPin,
  Phone,
  Star,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Quote,
  ChevronRight,
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
        limit: 3,
      },
      avaliacoes: {
        orderBy: [desc(avaliacoes.criadoEm)],
        limit: 6,
      },
    },
  });

  if (!negocioDb || !negocioDb.siteAtivo) {
    notFound();
  }

  const servicos = (negocioDb.siteServicos as string[] | null) ?? [];
  const temWhatsapp = !!negocioDb.siteWhatsapp;
  const whatsappLink = temWhatsapp
    ? `https://wa.me/55${negocioDb.siteWhatsapp?.replace(/\D/g, "")}`
    : null;

  // Montagem do JSON-LD para SEO
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
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLd) }}
      />

      {/* --- BACKGROUND BLOBS ANIMADOS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] mix-blend-screen opacity-50 animate-pulse duration-[10000ms]" />
        <div className="absolute top-[30%] -right-[15%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[150px] mix-blend-screen opacity-50 animate-pulse duration-[7000ms] delay-1000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[180px] mix-blend-screen opacity-50 animate-pulse duration-[10000ms] delay-500" />
      </div>

      {/* --- NAVBAR STICKY GLASS --- */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {negocioDb.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocioDb.logoUrl}
                alt={`Logo ${negocioDb.nome}`}
                className="w-10 h-10 object-cover rounded-xl shadow-lg ring-1 ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center font-black text-white text-xl shadow-lg">
                {negocioDb.nome.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg text-white tracking-tight hidden sm:block">
              {negocioDb.nome}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105 active:scale-95"
              >
                Fale Conosco
              </a>
            )}
            {negocioDb.telefone && (
              <a
                href={`tel:${negocioDb.telefone}`}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95 border border-primary/50"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Ligar Agora</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-40 pb-20 sm:pt-48 sm:pb-32 z-10">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary-foreground text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-emerald-400" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Destaque na sua região
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {negocioDb.siteHeadline || negocioDb.nome}
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            {negocioDb.siteSubtitulo ||
              negocioDb.descricao ||
              `A excelência em ${negocioDb.categoria} que você precisava.`}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-in fade-in zoom-in-95 duration-700 delay-500">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-3 text-base font-bold px-8 py-4 rounded-full bg-emerald-500 text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_#10b981]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <MessageCircle className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Agendar pelo WhatsApp</span>
              </a>
            )}
            
            <div className="flex items-center gap-2 text-sm font-medium px-6 py-4 rounded-full glass border border-white/5 text-slate-300">
              <MapPin className="w-5 h-5 text-primary" />
              {negocioDb.cidade} - {negocioDb.estado}
            </div>
          </div>
        </div>
      </header>

      {/* --- SEÇÃO DE SERVIÇOS --- */}
      {servicos.length > 0 && (
        <section className="relative py-24 z-10 border-t border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                Nossos Serviços
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Soluções projetadas sob medida com o mais alto padrão de qualidade do mercado.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicos.map((servico, i) => (
                <div
                  key={i}
                  className="group relative glass-card p-8 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-6xl font-black">0{i + 1}</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-2xl text-white mb-3">
                    {servico}
                  </h3>
                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    Atendimento de alto nível e foco em resultados excepcionais para você.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- DIFERENCIAL --- */}
      {negocioDb.siteDiferencial && (
        <section className="relative py-24 z-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="glass rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="relative z-10">
                <Star className="w-12 h-12 text-emerald-400 mx-auto mb-8 animate-pulse" />
                <h2 className="text-3xl sm:text-5xl font-bold mb-8 tracking-tight text-white">
                  O Que Nos Torna Únicos
                </h2>
                <p className="text-xl sm:text-2xl text-slate-300 leading-relaxed font-medium max-w-3xl mx-auto">
                  "{negocioDb.siteDiferencial}"
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- POSTAGENS GMB GERADAS --- */}
      {negocioDb.postagens.length > 0 && (
        <section className="relative py-24 z-10 border-t border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
                  Últimas Novidades
                </h2>
                <p className="text-slate-400 text-lg">
                  Acompanhe nosso trabalho em tempo real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {negocioDb.postagens.map((post: any) => (
                <div
                  key={post.id}
                  className="group relative rounded-3xl overflow-hidden glass border border-white/10 flex flex-col min-h-[400px] hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-shadow duration-500"
                >
                  {post.imagemUrl && (
                    <div className="absolute inset-0 z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.imagemUrl}
                        alt="Foto do estabelecimento"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/80 to-transparent" />
                    </div>
                  )}
                  {!post.imagemUrl && (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-white/0" />
                  )}
                  
                  <div className="relative z-10 p-8 flex flex-col h-full justify-end mt-auto">
                    <span className="inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold tracking-wider mb-4 w-fit uppercase backdrop-blur-md">
                      {post.tipo}
                    </span>
                    <p className="text-sm font-medium text-white line-clamp-4 leading-relaxed mb-4">
                      {post.conteudo}
                    </p>
                    <div className="flex items-center text-xs font-medium text-slate-400 mt-2">
                       {formatarData(post.criadoEm)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- AVALIAÇÕES DE CLIENTES --- */}
      {negocioDb.avaliacoes && negocioDb.avaliacoes.length > 0 && (
        <section className="relative py-24 z-10">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-center text-white mb-4">
              Clientes Satisfeitos
            </h2>
            <p className="text-slate-400 text-center mb-16 text-lg max-w-2xl mx-auto">
              Veja por que tantas pessoas confiam no nosso trabalho.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {negocioDb.avaliacoes.map((avaliacao: any) => (
                <div
                  key={avaliacao.id}
                  className="glass-card p-8 relative isolate"
                >
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-white/5 -z-10 transform scale-150" />
                  <div className="flex items-center gap-1.5 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                         key={i}
                         className={`w-5 h-5 ${
                           i < (avaliacao.nota ?? 5)
                             ? "text-yellow-400 fill-yellow-400"
                             : "text-slate-700"
                         }`}
                      />
                    ))}
                  </div>
                  <p className="text-base text-slate-300 leading-relaxed mb-6 font-medium">
                    "{avaliacao.texto || "Um serviço excepcional, recomendo demais!"}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="font-bold text-white">
                        {(avaliacao.autor || "C").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-white">
                      {avaliacao.autor || "Cliente Verificado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- INOVAÇÃO & ARTIGOS --- */}
      {negocioDb.artigos.length > 0 && (
        <section className="relative py-24 z-10 border-t border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
              Insights e Dicas
            </h2>
            <p className="text-slate-400 text-lg mb-16 max-w-2xl">
              Conteúdos criados por nossos especialistas para agregar valor ao seu dia a dia.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {negocioDb.artigos.map((art: any) => (
                <Link
                  href={`/blog/${art.slug}`}
                  key={art.id}
                  className="group flex flex-col glass rounded-3xl overflow-hidden hover:ring-1 hover:ring-primary/50 transition-all duration-300 hover:-translate-y-2"
                >
                  {art.imagemHero ? (
                    <div className="w-full h-48 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.imagemHero}
                        alt={art.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] to-transparent opacity-80" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-white/5 to-transparent" />
                  )}
                  
                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors mb-3 leading-snug">
                      {art.titulo}
                    </h3>
                    <p className="text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-1 text-sm">
                      {art.metaDescricao}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide mt-auto group-hover:gap-3 transition-all">
                      LER ARTIGO PARA SABER MAIS <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- CTA FINAL --- */}
      {whatsappLink && (
        <section className="relative py-32 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-white mb-6">
              Pronto para transformar<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">sua experiência?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Nossa equipe está preparada para entregar o melhor serviço para você hoje mesmo.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-black px-12 py-5 rounded-full bg-white text-[#050B14] hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] text-lg group"
            >
              Falar com um Especialista
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/10 relative z-10 bg-[#02050A]">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             {negocioDb.logoUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={negocioDb.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg grayscale opacity-50" />
             ) : (
               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white/50">
                 {negocioDb.nome.charAt(0)}
               </div>
             )}
             <span className="text-white/50 font-medium text-sm">
               © {new Date().getFullYear()} {negocioDb.nome}. Todos os direitos reservados.
             </span>
          </div>
          <p className="text-sm text-white/30 font-medium flex items-center gap-1">
            Plataforma powered by <span className="text-white/60 font-bold ml-1">LocalSEO AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
