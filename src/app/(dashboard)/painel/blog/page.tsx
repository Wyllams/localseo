import { FileText, Globe, Search, BookOpen, MessageSquare, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, artigos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { CriadorBlog } from "./criador-blog";
import { excluirArtigo } from "./actions";
import Link from "next/link";
import { Star } from "lucide-react";
import { getAcessoPlano } from "@/lib/planos";
import { FeatureGate } from "@/components/feature-gate";
import type { PlanoAssinatura } from "@/types";

export default async function PaginaBlog() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const acesso = getAcessoPlano((negocioUser.plano ?? "STARTER") as PlanoAssinatura);
  if (!acesso.blogLiberado) {
    return (
      <FeatureGate
        feature="blogLiberado"
        liberado={false}
        descricao="Gere artigos gigantes estruturados (EEAT) para dominar as buscas locais. Disponível a partir do plano Pro."
      >
        <div />
      </FeatureGate>
    );
  }

  const listaArtigos = await bd.query.artigos.findMany({
    where: eq(artigos.negocioId, negocioUser.id),
    orderBy: [desc(artigos.criadoEm)],
  });

  // Métricas agregadas
  const totalPalavras = listaArtigos.reduce((acc, a) => acc + (a.wordCount ?? 0), 0);
  const comFaq = listaArtigos.filter((a) => a.faqSchema && Array.isArray(a.faqSchema) && (a.faqSchema as unknown[]).length > 0).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Portal & Blog (SEO Long-form)</h1>
          <p className="text-muted-foreground mt-1">
            Gere artigos estruturados (EEAT) com FAQ e internal linking para dominar as buscas locais.
          </p>
        </div>
      </div>

      {/* Criador + Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CriadorBlog />
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex flex-col justify-center bg-sucesso/5 border border-sucesso/20">
            <div className="flex items-center gap-3 text-sucesso mb-3">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Artigos</span>
            </div>
            <p className="text-3xl font-bold">{listaArtigos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">páginas indexáveis no Google</p>
          </div>
          
          <div className="glass-card p-5 flex flex-col justify-center border border-border">
            <div className="flex items-center gap-3 text-primary mb-3">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Palavras</span>
            </div>
            <p className="text-3xl font-bold">{totalPalavras.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">total de conteúdo escrito</p>
          </div>

          <div className="glass-card p-5 flex flex-col justify-center border border-border">
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Com FAQ</span>
            </div>
            <p className="text-3xl font-bold">{comFaq}</p>
            <p className="text-xs text-muted-foreground mt-1">artigos com schema FAQ</p>
          </div>
        </div>
      </div>

      {/* Lista de Artigos */}
      <div className="glass-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sucesso" />
          Acervo de Artigos
          <span className="ml-auto text-xs text-muted-foreground font-normal">{listaArtigos.length} artigos</span>
        </h2>

        {listaArtigos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-border mt-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium">Seu Blog está vazio</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm mx-auto">
              Use a IA ao lado para montar seu primeiro pilar de conteúdo SEO.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {listaArtigos.map((artigo: any) => (
              <div key={artigo.id} className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-stretch group">
                {/* Thumbnail */}
                <div className="w-full sm:w-48 h-32 bg-muted rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center self-start">
                  {artigo.imagemHero ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artigo.imagemHero} alt={artigo.titulo} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-foreground">SEO Longo</div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate" title={artigo.titulo}>{artigo.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{artigo.metaDescricao}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[10px] px-2 py-1 rounded bg-sucesso/10 text-sucesso font-semibold border border-sucesso/20">
                      🎯 {artigo.palavraChave}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                      {artigo.status}
                    </span>
                    {artigo.wordCount && (
                      <span className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {artigo.wordCount} palavras
                      </span>
                    )}
                    {artigo.readingTime && (
                      <span className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground border border-border flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {artigo.readingTime} min
                      </span>
                    )}
                    {artigo.faqSchema && Array.isArray(artigo.faqSchema) && (artigo.faqSchema as unknown[]).length > 0 && (
                      <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        FAQ ({(artigo.faqSchema as unknown[]).length})
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="sm:text-right shrink-0 flex flex-row sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto h-full">
                  <div className="text-xs text-muted-foreground flex flex-col items-start sm:items-end">
                    <span>{formatarData(artigo.criadoEm)}</span>
                    <span>{tempoRelativo(artigo.criadoEm)}</span>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 mt-auto pt-6 justify-end w-full sm:w-auto">
                    <Link 
                      href={`/blog/${artigo.slug}`}
                      target="_blank"
                      className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1.5 transition-colors"
                    >
                      Ler Artigo <Globe className="w-4 h-4" />
                    </Link>
                    <form action={excluirArtigo}>
                      <input type="hidden" name="id" value={artigo.id} />
                      <button 
                        type="submit" 
                        className="flex items-center gap-1.5 text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/10 px-2 py-1.5 -mr-2 rounded-md transition-colors"
                        title="Excluir Artigo"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
