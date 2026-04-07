import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import {
  negocios,
  pontuacoesPresenca,
  avaliacoes,
  postagens,
  artigos,
  landingPages,
  palavrasChaveNegocio,
  historicoRanking,
  execucoesAgente,
} from "@/db/schema";
import { eq, desc, count, gte, and } from "drizzle-orm";
import {
  TrendingUp,
  Activity,
  Sparkles,
  MapPin,
  Star,
  Globe,
  BookOpen,
  Target,
  BarChart3,
  PenSquare,
  FileText,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { GraficoEvolucao } from "@/components/dashboard/grafico-evolucao";
import { formatarData } from "@/lib/utils";
import { obterProximosFeriados, type FeriadoFormatado } from "@/lib/agents/agente-feriados";

export default async function PainelRelatorios() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const hoje = new Date();
  const trintaDias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Buscar dados em paralelo
  const [
    pontuacaoAtual,
    pontuacoesHist,
    avaliacoesRes,
    postsMesRes,
    artigosRes,
    artigosPublicadosRes,
    lpsRes,
    kwsRes,
    rankingsRes,
    execucoesRes,
  ] = await Promise.all([
    bd.query.pontuacoesPresenca.findFirst({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
    }),
    bd.query.pontuacoesPresenca.findMany({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
      limit: 10,
    }),
    bd.query.avaliacoes.findMany({
      where: eq(avaliacoes.negocioId, negocioUser.id),
      columns: { id: true, nota: true, textoResposta: true },
    }),
    bd.select({ count: count() })
      .from(postagens)
      .where(and(eq(postagens.negocioId, negocioUser.id), gte(postagens.criadoEm, trintaDias))),
    bd.select({ count: count() }).from(artigos).where(eq(artigos.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(artigos).where(and(eq(artigos.negocioId, negocioUser.id), eq(artigos.status, "PUBLICADO"))),
    bd.select({ count: count() }).from(landingPages).where(and(eq(landingPages.negocioId, negocioUser.id), eq(landingPages.ativo, true))),
    bd.select({ count: count() }).from(palavrasChaveNegocio).where(eq(palavrasChaveNegocio.negocioId, negocioUser.id)),
    bd.query.historicoRanking.findMany({
      where: eq(historicoRanking.negocioId, negocioUser.id),
      orderBy: [desc(historicoRanking.verificadoEm)],
      limit: 20,
    }),
    bd.query.execucoesAgente.findMany({
      where: eq(execucoesAgente.negocioId, negocioUser.id),
      orderBy: [desc(execucoesAgente.criadoEm)],
      limit: 10,
    }),
  ]);

  // Scores
  const score = pontuacaoAtual?.total || 0;
  const scoreGmb = pontuacaoAtual?.pontuacaoGmb || 0;
  const scoreAvaliacoes = pontuacaoAtual?.pontuacaoAvaliacoes || 0;
  const scoreSite = pontuacaoAtual?.pontuacaoSite || 0;
  const scoreBlog = pontuacaoAtual?.pontuacaoBlog || 0;

  // Gráfico
  const dadosGrafico = pontuacoesHist
    .reverse()
    .map((p) => ({ data: formatarData(p.criadoEm).substring(0, 5), score: p.total }));
  if (dadosGrafico.length === 0) {
    dadosGrafico.push({ data: formatarData(new Date()), score: 0 });
  }

  // Avaliações métricas
  const totalAvaliacoes = avaliacoesRes.length;
  const comResposta = avaliacoesRes.filter((a) => a.textoResposta).length;
  const notaMedia = totalAvaliacoes > 0
    ? (avaliacoesRes.reduce((s, a) => s + (a.nota || 0), 0) / totalAvaliacoes).toFixed(1)
    : "0";
  const taxaResposta = totalAvaliacoes > 0
    ? Math.round((comResposta / totalAvaliacoes) * 100)
    : 0;

  // Rankings
  const kwMap = new Map<string, (typeof rankingsRes)[0]>();
  for (const r of rankingsRes) {
    if (!kwMap.has(r.palavraChave)) kwMap.set(r.palavraChave, r);
  }
  const topKws = [...kwMap.values()].sort((a, b) => (a.posicao || 100) - (b.posicao || 100));
  const top3 = topKws.filter((k) => k.posicao && k.posicao <= 3).length;
  const top10 = topKws.filter((k) => k.posicao && k.posicao <= 10).length;

  // Conteúdo
  const postsRecentes = postsMesRes[0]?.count || 0;
  const totalArtigos = artigosRes[0]?.count || 0;
  const artigosPublicados = artigosPublicadosRes[0]?.count || 0;
  const totalLPs = lpsRes[0]?.count || 0;
  const totalKWs = kwsRes[0]?.count || 0;

  // Feriados
  let feriados: FeriadoFormatado[] = [];
  try { feriados = await obterProximosFeriados(3); } catch {}

  // Execuções de agentes
  const sucessos = execucoesRes.filter((e) => e.status === "SUCESSO").length;
  const falhas = execucoesRes.filter((e) => e.status === "FALHOU").length;

  // Pilares para visualização
  const pilares = [
    { label: "Google Meu Negócio", score: scoreGmb, max: 25, icon: MapPin, cor: "text-blue-500", bg: "bg-blue-500", desc: `${postsRecentes} posts (30d) · ${negocioUser.gmbLocalId ? "Conectado" : "Não conectado"}` },
    { label: "Avaliações", score: scoreAvaliacoes, max: 25, icon: Star, cor: "text-amber-500", bg: "bg-amber-500", desc: `${totalAvaliacoes} avaliações · ${notaMedia}★ · ${taxaResposta}% respondidas` },
    { label: "Site & SEO", score: scoreSite, max: 25, icon: Globe, cor: "text-sucesso", bg: "bg-sucesso", desc: `${totalLPs} landing pages · ${totalKWs} keywords · NAP ✓` },
    { label: "Blog & Conteúdo", score: scoreBlog, max: 25, icon: BookOpen, cor: "text-purple-500", bg: "bg-purple-500", desc: `${artigosPublicados}/${totalArtigos} artigos publicados` },
  ];

  const scoreColor = score >= 70 ? "text-sucesso" : score >= 40 ? "text-amber-500" : "text-destructive";
  const scoreStroke = score >= 70 ? "hsl(142, 71%, 45%)" : score >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Relatório de Performance
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
          Diagnóstico Local SEO
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Análise completa dos 4 pilares de presença digital — {negocioUser.nome}
        </p>
      </div>

      {/* Score + 4 Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Central */}
        <div className="lg:col-span-4 glass-card p-8 flex flex-col justify-center items-center text-center border border-border relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">Score de Presença</h2>
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 score-circle rotate-[-90deg]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(217, 33%, 17%)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={scoreStroke} strokeWidth="6" strokeLinecap="round"
                strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100}
                className="transition-all duration-1000 ease-out drop-shadow-md" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tighter">{score}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">/ 100</span>
            </div>
          </div>
          <p className={`mt-6 text-sm font-bold ${scoreColor}`}>
            {score >= 70 ? "🏆 Excelente" : score >= 40 ? "⚡ Bom, mas pode melhorar" : "⚠️ Presença fraca"}
          </p>
        </div>

        {/* 4 Pilares Detalhados */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pilares.map((p) => {
            const Icon = p.icon;
            const pct = Math.round((p.score / p.max) * 100);
            return (
              <div key={p.label} className="glass-card p-6 border border-border group hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg ${p.bg}/20 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${p.cor}`} />
                    </div>
                    <span className="font-semibold text-sm">{p.label}</span>
                  </div>
                  <span className="text-lg font-bold">{p.score}<span className="text-xs text-muted-foreground font-normal">/{p.max}</span></span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${p.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico + Resumo de Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução */}
        <div className="lg:col-span-2 glass-card p-6 border border-border flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            Evolução do Score
          </h2>
          <p className="text-sm text-muted-foreground border-b border-border/50 pb-4">
            Histórico de pontuação ao longo do tempo.
          </p>
          <div className="flex-1 min-h-[280px]">
            <GraficoEvolucao dados={dadosGrafico} />
          </div>
        </div>

        {/* Resumo de Ações */}
        <div className="lg:col-span-1 glass-card p-6 border border-border">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-sucesso" />
            Resumo de Ações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sucesso" />
                <span className="text-sm font-medium">Execuções Sucesso</span>
              </div>
              <span className="text-lg font-bold text-sucesso">{sucessos}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Keywords na 1ª Pg</span>
              </div>
              <span className="text-lg font-bold text-amber-500">{top10}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Keywords Top 3</span>
              </div>
              <span className="text-lg font-bold text-primary">{top3}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Falhas</span>
              </div>
              <span className="text-lg font-bold text-destructive">{falhas}</span>
            </div>
          </div>

          {/* Próximo feriado */}
          {feriados.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-500">Próximo Feriado</span>
              </div>
              <p className="text-sm font-medium">{feriados[0].nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{feriados[0].dataFormatada} · {feriados[0].diasRestantes}d</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Execuções */}
      {execucoesRes.length > 0 && (
        <div className="glass-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Últimas Execuções de Agentes IA
            </h3>
          </div>
          <div className="divide-y divide-border">
            {execucoesRes.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                {e.status === "SUCESSO" ? (
                  <CheckCircle2 className="w-4 h-4 text-sucesso shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm font-medium flex-1">{e.tipo}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${
                  e.status === "SUCESSO" ? "bg-sucesso/10 text-sucesso border-sucesso/20" : "bg-destructive/10 text-destructive border-destructive/20"
                }`}>{e.status}</span>
                {e.duracaoMs && <span className="text-xs text-muted-foreground">{(e.duracaoMs / 1000).toFixed(1)}s</span>}
                <span className="text-xs text-muted-foreground">{formatarData(e.criadoEm)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
