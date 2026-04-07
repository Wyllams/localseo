import {
  Star,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Bot,
  TrendingUp,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, avaliacoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TabelaAvaliacoes } from "./tabela-avaliacoes";
import { cn } from "@/lib/utils";

export default async function PaginaAvaliacoes() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  // Buscar avaliações
  const listaAvaliacoes = await bd.query.avaliacoes.findMany({
    where: eq(avaliacoes.negocioId, negocioUser.id),
    orderBy: [desc(avaliacoes.publicadoEm)],
  });

  // ===== Métricas =====
  const total = listaAvaliacoes.length;
  const respondidas = listaAvaliacoes.filter((a) => a.respondido).length;
  const pendentes = total - respondidas;
  const negativas = listaAvaliacoes.filter((a) => a.sentimento === "NEGATIVO").length;
  const taxaResposta = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  const somaNotas = listaAvaliacoes.reduce((acc, a) => acc + (a.nota || 0), 0);
  const media = total > 0 ? (somaNotas / total).toFixed(1) : "0.0";

  // Distribuição de estrelas
  const distribuicao = [5, 4, 3, 2, 1].map((nota) => {
    const qtd = listaAvaliacoes.filter((a) => a.nota === nota).length;
    return { nota, qtd, pct: total > 0 ? Math.round((qtd / total) * 100) : 0 };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e responda avaliações com Inteligência Artificial
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border hover:bg-muted font-medium transition-all text-sm w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" />
          Sincronizar Google
        </button>
      </div>

      {/* Cards Métricas — Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nota Média */}
        <div className="glass-card p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota Média</span>
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold">{media}</h2>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <div className="flex mt-2 gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-4 h-4",
                  s <= Math.round(parseFloat(media as string))
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="glass-card p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold">{total}</h2>
            <span className="text-sm text-muted-foreground">avaliações</span>
          </div>
        </div>

        {/* Taxa de Resposta */}
        <div className="glass-card p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa de Resposta</span>
            <CheckCircle2 className="w-5 h-5 text-sucesso" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className={cn("text-4xl font-bold", taxaResposta >= 80 ? "text-sucesso" : taxaResposta >= 50 ? "text-amber-500" : "text-destructive")}>
              {taxaResposta}%
            </h2>
            <span className="text-sm text-muted-foreground">{respondidas}/{total}</span>
          </div>
          {/* Mini bar */}
          <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                taxaResposta >= 80 ? "bg-sucesso" : taxaResposta >= 50 ? "bg-amber-500" : "bg-destructive"
              )}
              style={{ width: `${taxaResposta}%` }}
            />
          </div>
        </div>

        {/* Pendentes */}
        <div className={cn("glass-card p-6 border", pendentes > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-border")}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", pendentes > 0 ? "text-amber-500" : "text-muted-foreground")}>
              Pendentes
            </span>
            {pendentes > 0 ? (
              <Bot className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-sucesso" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className={cn("text-4xl font-bold", pendentes > 0 ? "text-amber-500" : "text-sucesso")}>
              {pendentes}
            </h2>
            <span className="text-sm text-muted-foreground">
              {pendentes === 0 ? "Tudo respondido!" : "aguardando"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Distribuição de Estrelas + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribuição */}
        <div className="lg:col-span-2 glass-card p-6 border border-border">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Distribuição de Estrelas
          </h3>
          <div className="space-y-2.5">
            {distribuicao.map((d) => (
              <div key={d.nota} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 justify-end shrink-0">
                  <span className="text-sm font-medium">{d.nota}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      d.nota >= 4 ? "bg-sucesso" : d.nota === 3 ? "bg-amber-500" : "bg-destructive"
                    )}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                  {d.qtd} ({d.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Críticas Card */}
        <div className={cn(
          "glass-card p-6 border flex flex-col",
          negativas > 0 ? "border-destructive/30 bg-destructive/5" : "border-border"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", negativas > 0 ? "text-destructive" : "text-muted-foreground")}>
              Avaliações Críticas
            </span>
            <AlertCircle className={cn("w-5 h-5", negativas > 0 ? "text-destructive" : "text-muted-foreground/30")} />
          </div>
          <h2 className={cn("text-4xl font-bold mb-2", negativas > 0 ? "text-destructive" : "text-sucesso")}>
            {negativas}
          </h2>
          {negativas > 0 ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Avaliações negativas sem resposta prejudicam seu SEO local. 
              Use a IA para gerar respostas empáticas e profissionais.
            </p>
          ) : (
            <p className="text-xs text-sucesso/80 leading-relaxed">
              Nenhuma avaliação crítica. Continue mantendo a qualidade!
            </p>
          )}
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Respondidas com IA: {listaAvaliacoes.filter(a => a.respondido && a.textoResposta).length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <TabelaAvaliacoes avaliacoes={listaAvaliacoes} negocioId={negocioUser.id} />
      </div>
    </div>
  );
}
