import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, historicoRanking, palavrasChaveNegocio, artigos, landingPages, postagens } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import {
  BarChart3,
  MousePointerClick,
  Eye,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Link2,
  FileText,
  Search,
  MapPin,
  Zap,
  Target,
  BookOpen,
} from "lucide-react";
import { getAcessoPlano } from "@/lib/planos";
import { FeatureGate } from "@/components/feature-gate";
import type { PlanoAssinatura } from "@/types";
import { calcularMetricasAnalytics } from "@/lib/agents/rastreador-ranking";

export default async function PaginaAnalytics() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const acesso = getAcessoPlano((negocioUser.plano ?? "STARTER") as PlanoAssinatura);
  if (!acesso.analyticsLiberado) {
    return (
      <FeatureGate
        feature="analyticsLiberado"
        liberado={false}
        descricao="Obtenha insights profundos sobre o desempenho do seu site, cliques, impressões e CTR. Disponível no plano Pro+."
      >
        <div />
      </FeatureGate>
    );
  }

  const scConectado = negocioUser.scConectado;

  // Buscar dados para métricas
  const keywords = await bd.query.palavrasChaveNegocio.findMany({
    where: eq(palavrasChaveNegocio.negocioId, negocioUser.id),
  });

  const ultimosRankings = await bd.query.historicoRanking.findMany({
    where: eq(historicoRanking.negocioId, negocioUser.id),
    orderBy: [desc(historicoRanking.verificadoEm)],
    limit: 50,
  });

  const totalArtigos = await bd.query.artigos.findMany({
    where: eq(artigos.negocioId, negocioUser.id),
    columns: { id: true },
  });

  const totalLPs = await bd.query.landingPages.findMany({
    where: eq(landingPages.negocioId, negocioUser.id),
    columns: { id: true },
  });

  const totalPosts = await bd.query.postagens.findMany({
    where: eq(postagens.negocioId, negocioUser.id),
    columns: { id: true },
  });

  // Agrupar rankings por keyword (mais recente)
  const kwMap = new Map<string, (typeof ultimosRankings)[0]>();
  for (const r of ultimosRankings) {
    if (!kwMap.has(r.palavraChave)) kwMap.set(r.palavraChave, r);
  }
  const kwRecentes = [...kwMap.values()];

  // Métricas simuladas ou reais
  const metricas = calcularMetricasAnalytics(scConectado, keywords.length);

  // Métricas de ranking
  const top3 = kwRecentes.filter((r) => r.posicao && r.posicao <= 3).length;
  const top10 = kwRecentes.filter((r) => r.posicao && r.posicao <= 10).length;
  const posMedia = kwRecentes.length > 0
    ? (kwRecentes.reduce((s, r) => s + (r.posicao || 50), 0) / kwRecentes.length).toFixed(1)
    : "—";

  // Total de páginas indexáveis
  const totalPaginas = totalArtigos.length + totalLPs.length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Analytics SEO</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da performance de busca, conteúdo e presença digital.
        </p>
      </div>

      {/* Status SC */}
      {!scConectado && (
        <div className="glass-card p-5 border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Search Console não conectado</p>
              <p className="text-xs text-muted-foreground">Os dados abaixo são estimativas. Conecte o SC para dados reais.</p>
            </div>
          </div>
          <a
            href="/painel/configuracoes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shrink-0"
          >
            <Link2 className="w-4 h-4" /> Conectar SC
          </a>
        </div>
      )}

      {/* Cards de métricas de busca */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-blue-500 mb-3">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cliques</span>
          </div>
          <p className="text-3xl font-bold">{metricas.cliques.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 28 dias {!scConectado && "(est.)"}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-purple-500 mb-3">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Impressões</span>
          </div>
          <p className="text-3xl font-bold">{metricas.impressoes.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 28 dias {!scConectado && "(est.)"}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-sucesso mb-3">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">CTR</span>
          </div>
          <p className="text-3xl font-bold">{metricas.ctr}%</p>
          <p className="text-xs text-muted-foreground mt-1">Taxa de cliques {!scConectado && "(est.)"}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-amber-500 mb-3">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pos. Média</span>
          </div>
          <p className="text-3xl font-bold">{posMedia}</p>
          <p className="text-xs text-muted-foreground mt-1">Posição no Google</p>
        </div>
      </div>

      {/* Status de Conteúdo e Presença */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="glass-card p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Páginas</p>
            <p className="text-lg font-bold">{totalPaginas}</p>
          </div>
        </div>
        <div className="glass-card p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sucesso/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-sucesso" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Artigos</p>
            <p className="text-lg font-bold">{totalArtigos.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Posts GMB</p>
            <p className="text-lg font-bold">{totalPosts.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Keywords</p>
            <p className="text-lg font-bold">{keywords.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top 10</p>
            <p className="text-lg font-bold">{top10}</p>
          </div>
        </div>
      </div>

      {/* Top Keywords por Posição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords Google */}
        <div className="glass-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Top Keywords — Google</h3>
          </div>
          {kwRecentes.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum dado. Execute o rastreamento.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {kwRecentes
                .sort((a, b) => (a.posicao || 100) - (b.posicao || 100))
                .slice(0, 10)
                .map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? "bg-sucesso/20 text-sucesso" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{r.palavraChave}</span>
                    <span className={`text-sm font-bold ${
                      r.posicao && r.posicao <= 3 ? "text-sucesso" :
                      r.posicao && r.posicao <= 10 ? "text-amber-500" : "text-muted-foreground"
                    }`}>
                      #{r.posicao || "?"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Keywords Maps */}
        <div className="glass-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Top Keywords — Maps</h3>
          </div>
          {kwRecentes.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum dado. Execute o rastreamento.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {kwRecentes
                .filter((r) => r.posicaoMaps)
                .sort((a, b) => (a.posicaoMaps || 100) - (b.posicaoMaps || 100))
                .slice(0, 10)
                .map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? "bg-sucesso/20 text-sucesso" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{r.palavraChave}</span>
                    <span className={`text-sm font-bold ${
                      r.posicaoMaps && r.posicaoMaps <= 3 ? "text-sucesso" :
                      r.posicaoMaps && r.posicaoMaps <= 10 ? "text-amber-500" : "text-muted-foreground"
                    }`}>
                      #{r.posicaoMaps || "?"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
