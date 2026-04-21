"use client";

import { useState, useEffect } from "react";
import { buscarMetricasGMB } from "@/app/(dashboard)/painel/performance-gmb/actions";
import {
  Eye,
  MousePointerClick,
  PhoneCall,
  Navigation,
  Search,
  MapPin,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { GmbPerformanceData, GmbSearchKeyword } from "@/lib/google/mybusiness";

interface MetricaCard {
  label: string;
  valor: number;
  icon: React.ElementType;
  cor: string;
  bgCor: string;
}

export function CardMetricasGMB() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<GmbPerformanceData | null>(null);
  const [keywords, setKeywords] = useState<GmbSearchKeyword[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const res = await buscarMetricasGMB(28);
        if (res.sucesso && res.metricas) {
          setMetricas(res.metricas);
          setKeywords(res.keywords ?? []);
        } else {
          setErro(res.erro || "Sem dados");
        }
      } catch {
        setErro("Erro ao carregar métricas.");
      }
      setLoading(false);
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 border border-border">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Carregando métricas do Google...
          </span>
        </div>
      </div>
    );
  }

  if (erro || !metricas) {
    return null; // Não exibir nada se não tiver dados
  }

  const cards: MetricaCard[] = [
    {
      label: "Buscas Maps",
      valor: metricas.buscasMaps,
      icon: MapPin,
      cor: "text-blue-500",
      bgCor: "bg-blue-500/10",
    },
    {
      label: "Buscas Google",
      valor: metricas.buscasSearch,
      icon: Search,
      cor: "text-emerald-500",
      bgCor: "bg-emerald-500/10",
    },
    {
      label: "Cliques Website",
      valor: metricas.cliquesWebsite,
      icon: MousePointerClick,
      cor: "text-purple-500",
      bgCor: "bg-purple-500/10",
    },
    {
      label: "Ligações",
      valor: metricas.cliquesLigacao,
      icon: PhoneCall,
      cor: "text-amber-500",
      bgCor: "bg-amber-500/10",
    },
    {
      label: "Rotas",
      valor: metricas.pedidosDirecao,
      icon: Navigation,
      cor: "text-rose-500",
      bgCor: "bg-rose-500/10",
    },
  ];

  const totalImpressoes = metricas.buscasMaps + metricas.buscasSearch;
  const totalAcoes =
    metricas.cliquesWebsite +
    metricas.cliquesLigacao +
    metricas.pedidosDirecao;
  const taxaConversao =
    totalImpressoes > 0
      ? ((totalAcoes / totalImpressoes) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-5 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Performance GMB
            <span className="text-[10px] text-muted-foreground font-normal">
              (últimos 28 dias)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">
                Taxa de Conversão
              </p>
              <p className="text-sm font-bold text-primary">{taxaConversao}%</p>
            </div>
          </div>
        </div>

        {/* Mini cards de métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`rounded-xl p-3 ${card.bgCor} border border-border/50`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${card.cor}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {card.label}
                  </span>
                </div>
                <p className="text-lg font-bold">
                  {card.valor.toLocaleString("pt-BR")}
                </p>
              </div>
            );
          })}
        </div>

        {/* Sparkline simplificado */}
        {metricas.seriesTemporal.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground mb-2">
              Impressões por dia
            </p>
            <div className="flex items-end gap-[2px] h-12">
              {metricas.seriesTemporal.map((dia, i) => {
                const maxImpressoes = Math.max(
                  ...metricas.seriesTemporal.map((d) => d.impressoes),
                  1
                );
                const altPct = Math.max(
                  (dia.impressoes / maxImpressoes) * 100,
                  4
                );
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 hover:bg-primary/60 rounded-t transition-colors cursor-default"
                    style={{ height: `${altPct}%` }}
                    title={`${dia.data}: ${dia.impressoes} impressões, ${dia.acoes} ações`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Keywords do Google */}
      {keywords.length > 0 && (
        <div className="glass-card p-5 border border-border">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-emerald-500" />
            Keywords Google
            <span className="text-[10px] text-muted-foreground font-normal">
              (que encontraram seu perfil)
            </span>
          </h3>
          <div className="space-y-2">
            {keywords.slice(0, 8).map((kw, i) => {
              const maxImpressions = keywords[0]?.impressions || 1;
              const barWidth = (kw.impressions / maxImpressions) * 100;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 3
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-medium truncate">
                    {kw.keyword}
                  </span>
                  <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/50 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">
                    {kw.impressions}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
