"use client";

import { useState } from "react";
import { Shield, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Globe, MapPin, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { executarVerificacaoNAP } from "./actions";
import type { ResultadoNAPCompleto } from "@/lib/agents/verificador-nap";

const FONTE_ICONS: Record<string, typeof Globe> = {
  WEBSITE: Globe,
  GOOGLE_MEU_NEGOCIO: Building2,
};

const FONTE_LABELS: Record<string, string> = {
  WEBSITE: "Website Externo",
  GOOGLE_MEU_NEGOCIO: "Google Meu Negócio",
};

export function VerificadorNAPClient() {
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoNAPCompleto | null>(null);

  async function handleVerificar() {
    setVerificando(true);
    try {
      const res = await executarVerificacaoNAP();
      if (res.sucesso && res.resultado) {
        setResultado(res.resultado);
        if (res.resultado.totalProblemas === 0) {
          toast.success("NAP 100% consistente! Excelente para SEO.");
        } else {
          toast.warning(`${res.resultado.totalProblemas} inconsistência(s) encontrada(s).`);
        }
      } else {
        toast.error(res.erro || "Falha na verificação.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão de verificação */}
      <div className="glass-card p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Verificação NAP</h3>
              <p className="text-sm text-muted-foreground">Compara Nome, Endereço e Telefone entre todas as fontes</p>
            </div>
          </div>
          <button
            onClick={handleVerificar}
            disabled={verificando}
            className="px-6 py-3 rounded-xl gradient-primary text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95"
          >
            {verificando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verificar Agora
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {resultado && (
        <>
          {/* Score */}
          <div className={`glass-card p-6 border ${resultado.scoreConsistencia === 100 ? "border-sucesso/30 bg-sucesso/5" : "border-amber-500/30 bg-amber-500/5"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black ${
                resultado.scoreConsistencia === 100 ? "bg-sucesso/20 text-sucesso" : "bg-amber-500/20 text-amber-500"
              }`}>
                {resultado.scoreConsistencia}%
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {resultado.scoreConsistencia === 100 ? "NAP Totalmente Consistente!" : "Inconsistências Detectadas"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {resultado.verificacoes.length} fonte(s) verificada(s) · {resultado.totalProblemas} problema(s)
                </p>
              </div>
            </div>
          </div>

          {/* Referência */}
          <div className="glass-card p-6 border border-border">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Dados de Referência (Perfil Cadastro)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome</p>
                  <p className="font-medium truncate">{resultado.referencia.nome || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Endereço</p>
                  <p className="font-medium truncate">{resultado.referencia.endereco || "Não cadastrado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Telefone</p>
                  <p className="font-medium truncate">{resultado.referencia.telefone || "Não cadastrado"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes por fonte */}
          <div className="space-y-3">
            {resultado.verificacoes.map((v, i) => {
              const fonteKey = v.fonte.split(":")[0].trim();
              const Icon = FONTE_ICONS[fonteKey] || Globe;
              const label = FONTE_LABELS[fonteKey] || v.fonte;

              return (
                <div key={i} className={`glass-card p-5 border transition-colors ${
                  v.consistente ? "border-sucesso/20 hover:border-sucesso/40" : "border-destructive/20 hover:border-destructive/40"
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`w-5 h-5 ${v.consistente ? "text-sucesso" : "text-destructive"}`} />
                    <span className="font-semibold flex-1">{label}</span>
                    {v.consistente ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-sucesso bg-sucesso/10 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Consistente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Inconsistente
                      </span>
                    )}
                  </div>
                  {v.problemas.length > 0 && (
                    <div className="space-y-1.5 mt-3 pl-8">
                      {v.problemas.map((p, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-destructive/80">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
