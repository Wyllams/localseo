import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, historicoRanking, palavrasChaveNegocio } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  TrendingUp,
  Search,
  BarChart3,
  MapPin,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Target,
} from "lucide-react";
import { getAcessoPlano } from "@/lib/planos";
import { FeatureGate } from "@/components/feature-gate";
import type { PlanoAssinatura } from "@/types";
import { cn, formatarData } from "@/lib/utils";
import { RastreadorClient } from "./rastreador-client";

export default async function PaginaRanking() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const acesso = getAcessoPlano((negocioUser.plano ?? "STARTER") as PlanoAssinatura);
  if (!acesso.rankTrackingLiberado) {
    return (
      <FeatureGate
        feature="rankTrackingLiberado"
        liberado={false}
        descricao="Monitore a posição exata das suas palavras-chave no Google Search Console e Google Maps. Disponível no plano Pro+."
      >
        <div />
      </FeatureGate>
    );
  }

  const historico = await bd.query.historicoRanking.findMany({
    where: eq(historicoRanking.negocioId, negocioUser.id),
    orderBy: [desc(historicoRanking.verificadoEm)],
    limit: 100,
  });

  const keywords = await bd.query.palavrasChaveNegocio.findMany({
    where: eq(palavrasChaveNegocio.negocioId, negocioUser.id),
  });

  // Agrupar por keyword (apenas dados mais recentes)
  const keywordMap = new Map<string, typeof historico>();
  for (const h of historico) {
    const existing = keywordMap.get(h.palavraChave);
    if (!existing) {
      keywordMap.set(h.palavraChave, [h]);
    } else if (existing.length < 2) {
      existing.push(h);
    }
  }

  // Métricas
  const ultimosRankings = [...keywordMap.entries()].map(([kw, entries]) => entries[0]);
  const top3 = ultimosRankings.filter((h) => h.posicao && h.posicao <= 3).length;
  const top10 = ultimosRankings.filter((h) => h.posicao && h.posicao <= 10).length;
  const top3Maps = ultimosRankings.filter((h) => h.posicaoMaps && h.posicaoMaps <= 3).length;
  const posMediaGoogle = ultimosRankings.length > 0
    ? (ultimosRankings.reduce((sum, h) => sum + (h.posicao || 50), 0) / ultimosRankings.length).toFixed(1)
    : "—";
  const posMediaMaps = ultimosRankings.length > 0
    ? (ultimosRankings.reduce((sum, h) => sum + (h.posicaoMaps || 50), 0) / ultimosRankings.length).toFixed(1)
    : "—";

  const ultimaVerificacao = historico[0]?.verificadoEm;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ranking no Google</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe a posição das suas palavras-chave nas buscas orgânicas e no Google Maps.
          </p>
        </div>
        <RastreadorClient />
      </div>

      {/* Cards métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Search className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Keywords</span>
          </div>
          <p className="text-2xl font-bold">{keywords.length}</p>
        </div>
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-sucesso mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Top 3</span>
          </div>
          <p className="text-2xl font-bold">{top3}</p>
        </div>
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Top 10</span>
          </div>
          <p className="text-2xl font-bold">{top10}</p>
        </div>
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Top 3 Maps</span>
          </div>
          <p className="text-2xl font-bold">{top3Maps}</p>
        </div>
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Pos. Média</span>
          </div>
          <p className="text-2xl font-bold">{posMediaGoogle}</p>
        </div>
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Última</span>
          </div>
          <p className="text-sm font-bold mt-1">{ultimaVerificacao ? formatarData(ultimaVerificacao) : "Nunca"}</p>
        </div>
      </div>

      {/* Tabela de Ranking */}
      <div className="glass-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Posições Atuais
          </h3>
          <span className="text-xs text-muted-foreground">{ultimosRankings.length} keywords rastreadas</span>
        </div>
        {ultimosRankings.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum dado de ranking ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm mx-auto">
              Clique em &quot;Rastrear Posições&quot; para iniciar o monitoramento das suas keywords.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Palavra-chave</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Google</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Maps</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Fonte</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ultimosRankings.map((h) => {
                  const entries = keywordMap.get(h.palavraChave);
                  const anterior = entries && entries.length > 1 ? entries[1] : null;
                  const mudancaGoogle = anterior?.posicao && h.posicao
                    ? anterior.posicao - h.posicao
                    : 0;

                  return (
                    <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium">{h.palavraChave}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {h.posicao ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={cn(
                              "text-sm font-bold",
                              h.posicao <= 3 ? "text-sucesso" : h.posicao <= 10 ? "text-amber-500" : "text-muted-foreground"
                            )}>
                              #{h.posicao}
                            </span>
                            {mudancaGoogle > 0 && <ArrowUp className="w-3 h-3 text-sucesso" />}
                            {mudancaGoogle < 0 && <ArrowDown className="w-3 h-3 text-destructive" />}
                            {mudancaGoogle === 0 && anterior && <Minus className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {h.posicaoMaps ? (
                          <span className={cn(
                            "text-sm font-bold",
                            h.posicaoMaps <= 3 ? "text-sucesso" : h.posicaoMaps <= 10 ? "text-amber-500" : "text-muted-foreground"
                          )}>
                            #{h.posicaoMaps}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {h.posicao && h.posicao <= 3 ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-sucesso/10 text-sucesso border border-sucesso/20 font-semibold">🏆 Top 3</span>
                        ) : h.posicao && h.posicao <= 10 ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">Página 1</span>
                        ) : h.posicao && h.posicao <= 20 ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">Página 2</span>
                        ) : (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border font-semibold">Fora</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                          h.fonte === "SEARCH_CONSOLE"
                            ? "bg-sucesso/10 text-sucesso border-sucesso/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {h.fonte === "SEARCH_CONSOLE" ? "SC Real" : h.fonte === "ESTIMATIVA" ? "Estimativa" : h.fonte}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {formatarData(h.verificadoEm)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
