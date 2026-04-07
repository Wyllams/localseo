import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import {
  negocios,
  avaliacoes,
  postagens,
  artigos,
  landingPages,
  palavrasChaveNegocio,
  historicoRanking,
  pontuacoesPresenca,
  execucoesAgente,
} from "@/db/schema";
import { eq, desc, count, gte, and } from "drizzle-orm";
import {
  TrendingUp,
  Star,
  FileText,
  PenSquare,
  Activity,
  Search,
  Globe,
  MapPin,
  BookOpen,
  Target,
  Shield,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { GraficoEvolucao } from "@/components/dashboard/grafico-evolucao";
import Link from "next/link";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { RecalcularScoreClient } from "./recalcular-score-client";

export default async function PaginaPainel() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  const esseMesData = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Buscar tudo em paralelo
  const [
    contagemAvaliacoes,
    avaliacoesNovas,
    contagemPostagens,
    postagensEsteMes,
    contagemArtigos,
    artigosPublicados,
    contagemLPs,
    contagemKWs,
    pontuacaoAtual,
    pontuacoesHistorico,
    atividadesRecentes,
    ultimosRankings,
  ] = await Promise.all([
    bd.select({ count: count() }).from(avaliacoes).where(eq(avaliacoes.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(avaliacoes).where(and(eq(avaliacoes.negocioId, negocioUser.id), gte(avaliacoes.criadoEm, trintaDiasAtras))),
    bd.select({ count: count() }).from(postagens).where(eq(postagens.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(postagens).where(and(eq(postagens.negocioId, negocioUser.id), gte(postagens.criadoEm, esseMesData))),
    bd.select({ count: count() }).from(artigos).where(eq(artigos.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(artigos).where(and(eq(artigos.negocioId, negocioUser.id), eq(artigos.status, "PUBLICADO"))),
    bd.select({ count: count() }).from(landingPages).where(and(eq(landingPages.negocioId, negocioUser.id), eq(landingPages.ativo, true))),
    bd.select({ count: count() }).from(palavrasChaveNegocio).where(eq(palavrasChaveNegocio.negocioId, negocioUser.id)),
    bd.query.pontuacoesPresenca.findFirst({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
    }),
    bd.query.pontuacoesPresenca.findMany({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
      limit: 10,
    }),
    bd.query.execucoesAgente.findMany({
      where: eq(execucoesAgente.negocioId, negocioUser.id),
      orderBy: [desc(execucoesAgente.criadoEm)],
      limit: 8,
    }),
    bd.query.historicoRanking.findMany({
      where: eq(historicoRanking.negocioId, negocioUser.id),
      orderBy: [desc(historicoRanking.verificadoEm)],
      limit: 10,
    }),
  ]);

  // Score
  const score = pontuacaoAtual?.total || 0;
  const scoreGmb = pontuacaoAtual?.pontuacaoGmb || 0;
  const scoreAvaliacoes = pontuacaoAtual?.pontuacaoAvaliacoes || 0;
  const scoreSite = pontuacaoAtual?.pontuacaoSite || 0;
  const scoreBlog = pontuacaoAtual?.pontuacaoBlog || 0;

  // Gráfico
  const dadosGrafico = pontuacoesHistorico
    .reverse()
    .map((p) => ({ data: formatarData(p.criadoEm).substring(0, 5), score: p.total }));
  if (dadosGrafico.length === 0) {
    dadosGrafico.push({ data: formatarData(new Date()), score: 0 });
  }

  const dados = {
    avaliacoes: { total: contagemAvaliacoes[0].count, novas: avaliacoesNovas[0].count },
    postagens: { total: contagemPostagens[0].count, esteMes: postagensEsteMes[0].count },
    artigos: { total: contagemArtigos[0].count, publicados: artigosPublicados[0].count },
    lps: contagemLPs[0].count,
    kws: contagemKWs[0].count,
  };

  // Ranking top keywords
  const kwMap = new Map<string, (typeof ultimosRankings)[0]>();
  for (const r of ultimosRankings) {
    if (!kwMap.has(r.palavraChave)) kwMap.set(r.palavraChave, r);
  }
  const topKws = [...kwMap.values()].sort((a, b) => (a.posicao || 100) - (b.posicao || 100)).slice(0, 5);

  // Cor do score
  const scoreColor = score >= 70 ? "text-sucesso" : score >= 40 ? "text-amber-500" : "text-destructive";
  const scoreStroke = score >= 70 ? "hsl(142, 71%, 45%)" : score >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";
  const scoreLabel = score >= 70 ? "Excelente" : score >= 40 ? "Bom" : "Precisa melhorar";

  // Pilares
  const pilares = [
    { label: "GMB", score: scoreGmb, max: 25, icon: MapPin, cor: "text-blue-500", bg: "bg-blue-500" },
    { label: "Avaliações", score: scoreAvaliacoes, max: 25, icon: Star, cor: "text-amber-500", bg: "bg-amber-500" },
    { label: "Site/SEO", score: scoreSite, max: 25, icon: Globe, cor: "text-sucesso", bg: "bg-sucesso" },
    { label: "Blog", score: scoreBlog, max: 25, icon: BookOpen, cor: "text-purple-500", bg: "bg-purple-500" },
  ];

  // Tipo ícones para atividades
  const tipoIcons: Record<string, typeof Activity> = {
    GMB: PenSquare, AVALIACOES: Star, BLOG: FileText, SITE: Globe,
    GMB_PERFIL: MapPin, RANK_TRACKER: TrendingUp, RELATORIO: BarChart3, NAP_CHECK: Shield,
  };
  const tipoCores: Record<string, string> = {
    GMB: "text-primary", AVALIACOES: "text-amber-500", BLOG: "text-sucesso", SITE: "text-blue-500",
    GMB_PERFIL: "text-purple-500", RANK_TRACKER: "text-sucesso", RELATORIO: "text-blue-500", NAP_CHECK: "text-primary",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Visão Geral — {negocioUser.nome}
          </h1>
          <p className="text-muted-foreground mt-1">
            Plano: <span className="font-medium text-primary uppercase">{negocioUser.plano}</span>
          </p>
        </div>
        <RecalcularScoreClient />
      </div>

      {/* Score Principal + 4 Pilares */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Score Circular */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center justify-center border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Score Total</p>
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 score-circle" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(217, 33%, 17%)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={scoreStroke} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100}
                className="animate-score-fill drop-shadow-md"
                style={{ "--score-offset": `${283 - (283 * score) / 100}` } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{score}</span>
              <span className="text-[10px] text-muted-foreground">de 100</span>
            </div>
          </div>
          <p className={`mt-3 text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
        </div>

        {/* 4 Pilares */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pilares.map((p) => {
            const Icon = p.icon;
            const pct = Math.round((p.score / p.max) * 100);
            return (
              <div key={p.label} className="glass-card p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${p.cor}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</span>
                </div>
                <p className="text-2xl font-bold">{p.score}<span className="text-sm text-muted-foreground font-normal">/{p.max}</span></p>
                {/* Barra de progresso */}
                <div className="h-1.5 w-full bg-muted/30 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${p.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% completo</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/painel/avaliacoes" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Star className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Avaliações</span>
          </div>
          <p className="text-xl font-bold">{dados.avaliacoes.total}</p>
          <p className="text-[10px] text-muted-foreground">+{dados.avaliacoes.novas} (30d)</p>
        </Link>

        <Link href="/painel/postagens" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-primary mb-2">
            <PenSquare className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Posts GMB</span>
          </div>
          <p className="text-xl font-bold">{dados.postagens.total}</p>
          <p className="text-[10px] text-muted-foreground">{dados.postagens.esteMes} este mês</p>
        </Link>

        <Link href="/painel/blog" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-sucesso mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Artigos</span>
          </div>
          <p className="text-xl font-bold">{dados.artigos.total}</p>
          <p className="text-[10px] text-muted-foreground">{dados.artigos.publicados} publicados</p>
        </Link>

        <Link href="/painel/site" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Landing Pages</span>
          </div>
          <p className="text-xl font-bold">{dados.lps}</p>
          <p className="text-[10px] text-muted-foreground">ativas</p>
        </Link>

        <Link href="/painel/palavras-chave" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Keywords</span>
          </div>
          <p className="text-xl font-bold">{dados.kws}</p>
          <p className="text-[10px] text-muted-foreground">rastreadas</p>
        </Link>

        <Link href="/painel/ranking" className="glass-card p-4 border border-border card-hover block">
          <div className="flex items-center gap-2 text-sucesso mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Top 10</span>
          </div>
          <p className="text-xl font-bold">{topKws.filter((k) => k.posicao && k.posicao <= 10).length}</p>
          <p className="text-[10px] text-muted-foreground">na 1ª página</p>
        </Link>
      </div>

      {/* Gráfico + Feed + Top KWs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Score */}
        <div className="lg:col-span-2 glass-card p-6 border border-border flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Evolução da Presença
            </h2>
          </div>
          <p className="text-sm text-muted-foreground border-b border-border/50 pb-4">
            Score ao longo do tempo — mantenha a frequência para melhorar.
          </p>
          <div className="flex-1 min-h-[280px]">
            <GraficoEvolucao dados={dadosGrafico} />
          </div>
        </div>

        {/* Feed + Top Keywords */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Top Keywords */}
          {topKws.length > 0 && (
            <div className="glass-card p-5 border border-border">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                Top Keywords
              </h3>
              <div className="space-y-2">
                {topKws.map((kw, i) => (
                  <div key={kw.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 3 ? "bg-sucesso/20 text-sucesso" : "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <span className="flex-1 text-xs font-medium truncate">{kw.palavraChave}</span>
                    <span className={`text-xs font-bold ${
                      kw.posicao && kw.posicao <= 3 ? "text-sucesso" :
                      kw.posicao && kw.posicao <= 10 ? "text-amber-500" : "text-muted-foreground"
                    }`}>#{kw.posicao || "?"}</span>
                  </div>
                ))}
              </div>
              <Link href="/painel/ranking" className="text-xs text-primary mt-3 flex items-center gap-1 hover:underline">
                Ver tudo <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Atividades Recentes */}
          <div className="glass-card p-5 border border-border flex-1 overflow-hidden">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-sucesso" />
              Atividades IA
            </h3>
            {atividadesRecentes.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Activity className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Sem atividades ainda</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
                {atividadesRecentes.map((a) => {
                  const Icon = tipoIcons[a.tipo] || Activity;
                  const cor = tipoCores[a.tipo] || "text-muted-foreground";
                  return (
                    <div key={a.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-muted border border-border shrink-0">
                        <Icon className={`w-3 h-3 ${cor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {a.tipo} — {a.status === "SUCESSO" ? "✅" : "❌"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{tempoRelativo(a.criadoEm)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
