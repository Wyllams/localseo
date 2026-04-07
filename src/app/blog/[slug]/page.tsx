import { bd } from "@/db";
import { artigos, negocios } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import {
  Globe,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  ChevronDown,
  HelpCircle,
  ArrowRight,
  Tag,
} from "lucide-react";
import { gerarMetadataSeo } from "@/lib/seo";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbArtigo = await bd.query.artigos.findFirst({
    where: eq(artigos.slug, slug),
    with: { negocio: true },
  });

  if (!dbArtigo) return { title: "Artigo não encontrado" };

  return gerarMetadataSeo({
    titulo: `${dbArtigo.titulo} | ${dbArtigo.negocio.nome}`,
    descricao: dbArtigo.metaDescricao || `Leia o artigo completo sobre ${dbArtigo.palavraChave}.`,
    url: `https://${dbArtigo.negocio.subdominio}.rikoseo.com.br/blog/${dbArtigo.slug}`,
    imagem: dbArtigo.imagemHero,
  });
}

export default async function PaginaLeituraBlog({ params }: PageProps) {
  const { slug } = await params;
  const dbArtigo = await bd.query.artigos.findFirst({
    where: eq(artigos.slug, slug),
    with: { negocio: true },
  });

  if (!dbArtigo) notFound();

  const blocos = dbArtigo.conteudo as any[];
  const faq = (dbArtigo.faqSchema as { pergunta: string; resposta: string }[] | null) ?? [];
  const internalLinks = (dbArtigo.internalLinks as { titulo: string; slug: string }[] | null) ?? [];

  // Buscar artigos relacionados diretamente do DB para garantir dados frescos
  const artigosRelacionados = await bd.query.artigos.findMany({
    where: and(
      eq(artigos.negocioId, dbArtigo.negocioId),
      ne(artigos.id, dbArtigo.id),
      eq(artigos.status, "PUBLICADO")
    ),
    orderBy: [desc(artigos.criadoEm)],
    limit: 3,
    columns: { titulo: true, slug: true, imagemHero: true, metaDescricao: true, palavraChave: true },
  });

  // JSON-LD: Article + FAQPage + BreadcrumbList
  const jsonLdSchemas: object[] = [];

  // Article schema
  jsonLdSchemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: dbArtigo.titulo,
    description: dbArtigo.metaDescricao,
    image: dbArtigo.imagemHero || "",
    author: {
      "@type": "Organization",
      name: dbArtigo.negocio.nome,
    },
    publisher: {
      "@type": "Organization",
      name: dbArtigo.negocio.nome,
      logo: {
        "@type": "ImageObject",
        url: dbArtigo.negocio.logoUrl || "",
      },
    },
    datePublished: dbArtigo.publicadoEm?.toISOString() || dbArtigo.criadoEm.toISOString(),
    dateModified: dbArtigo.criadoEm.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${dbArtigo.negocio.subdominio}.rikoseo.com.br/blog/${dbArtigo.slug}`,
    },
    wordCount: dbArtigo.wordCount,
    keywords: [dbArtigo.palavraChave, ...(dbArtigo.palavrasChaveSecundarias || [])].filter(Boolean).join(", "),
  });

  // FAQPage schema
  if (faq.length > 0) {
    jsonLdSchemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.resposta,
        },
      })),
    });
  }

  // BreadcrumbList
  jsonLdSchemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dbArtigo.negocio.nome, item: `https://${dbArtigo.negocio.subdominio}.rikoseo.com.br` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `https://${dbArtigo.negocio.subdominio}.rikoseo.com.br/blog` },
      { "@type": "ListItem", position: 3, name: dbArtigo.titulo },
    ],
  });

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* JSON-LD */}
      {jsonLdSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <Link href="/painel/blog" className="text-slate-400 flex items-center gap-2 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            {dbArtigo.negocio.nome}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl animate-fade-in pb-32">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Blog SEO</span>
          <span className="text-slate-400 text-sm flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatarData(dbArtigo.publicadoEm || dbArtigo.criadoEm)}
          </span>
          {dbArtigo.readingTime && (
            <span className="text-slate-400 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {dbArtigo.readingTime} min de leitura
            </span>
          )}
          {dbArtigo.wordCount && (
            <span className="text-slate-400 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {dbArtigo.wordCount} palavras
            </span>
          )}
        </div>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6 text-white">{dbArtigo.titulo}</h1>

        {/* Keyword tags */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">{dbArtigo.palavraChave}</span>
          {dbArtigo.palavrasChaveSecundarias?.map((kw, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">{kw}</span>
          ))}
        </div>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-10 pb-10 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {dbArtigo.negocio.nome.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Escrito por Equipe {dbArtigo.negocio.nome}</p>
            <p className="text-xs text-slate-400">Especialistas em {dbArtigo.negocio.categoria}</p>
          </div>
        </div>

        {/* Imagem Hero */}
        {dbArtigo.imagemHero && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-2xl border border-white/10 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dbArtigo.imagemHero} alt={dbArtigo.titulo} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Conteúdo */}
        <article className="prose prose-invert prose-blue max-w-none prose-img:rounded-xl prose-headings:font-bold prose-a:text-blue-400">
          {Array.isArray(blocos) && blocos.map((bloco, i) => {
            if (bloco.tag === "h2") return <h2 key={i} className="text-3xl mt-12 mb-6 text-white/90">{bloco.conteudo}</h2>;
            if (bloco.tag === "h3") return <h3 key={i} className="text-2xl mt-8 mb-4 text-white/80">{bloco.conteudo}</h3>;
            if (bloco.tag === "p") return <p key={i} className="text-slate-400 leading-relaxed mb-6 text-lg">{bloco.conteudo}</p>;
            if (bloco.tag === "ul") {
              const items = String(bloco.conteudo).split("|");
              return (
                <ul key={i} className="space-y-3 mb-8 bg-white/[0.03] p-6 rounded-xl border border-white/10">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-400 items-start">
                      <span className="text-primary mt-1">•</span>
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </article>

        {/* FAQ Section */}
        {faq.length > 0 && (
          <section className="mt-16 pt-12 border-t border-white/10" id="faq">
            <div className="flex items-center gap-2 mb-8 text-primary">
              <HelpCircle className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Perguntas Frequentes</h2>
            </div>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <details key={i} className="group glass-card border border-white/10 hover:border-primary/30 transition-colors overflow-hidden rounded-xl">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <h3 className="font-bold text-white pr-4">{item.pergunta}</h3>
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-slate-400 leading-relaxed">{item.resposta}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Artigos Relacionados (Internal Linking) */}
        {artigosRelacionados.length > 0 && (
          <section className="mt-16 pt-12 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-8">Leia Também</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {artigosRelacionados.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group glass-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  {rel.imagemHero ? (
                    <div className="w-full h-32 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rel.imagemHero} alt={rel.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-white/5 to-transparent" />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">{rel.titulo}</h3>
                    {rel.palavraChave && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">{rel.palavraChave}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl glass border border-primary/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white relative z-10">Gostou deste conteúdo?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10">
            A {dbArtigo.negocio.nome} é referência em {dbArtigo.negocio.categoria}. Venha nos visitar e comprove nossa qualidade.
          </p>
          {dbArtigo.negocio.telefone ? (
            <a
              href={`https://wa.me/55${dbArtigo.negocio.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-2 bg-emerald-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-1"
            >
              Falar pelo WhatsApp <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <button className="relative z-10 gradient-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1">
              Entre em Contato Agora
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 bg-[#02050A]">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} {dbArtigo.negocio.nome} · Powered by <span className="text-white/50 font-bold">RikoSEO AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
