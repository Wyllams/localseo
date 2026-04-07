"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { gerarSugestoesIA, adicionarKeyword } from "./actions";

interface SugestaoKW {
  palavra: string;
  tipo: string;
  motivo: string;
}

const tipoLabels: Record<string, { label: string; cor: string }> = {
  PRIMARY: { label: "Principal", cor: "bg-primary/10 text-primary border-primary/20" },
  SECONDARY: { label: "Secundária", cor: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  LONG_TAIL: { label: "Long Tail", cor: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  INFORMATIONAL: { label: "Informacional", cor: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  TRANSACTIONAL: { label: "Transacional", cor: "bg-sucesso/10 text-sucesso border-sucesso/20" },
};

export function SugestorKeywords() {
  const [sugestoes, setSugestoes] = useState<SugestaoKW[]>([]);
  const [gerando, setGerando] = useState(false);
  const [adicionadas, setAdicionadas] = useState<Set<string>>(new Set());

  async function handleGerar() {
    setGerando(true);
    setAdicionadas(new Set());
    try {
      const res = await gerarSugestoesIA();
      if (res.sucesso && res.sugestoes) {
        setSugestoes(res.sugestoes);
        toast.success(`${res.sugestoes.length} sugestões geradas!`);
      } else {
        toast.error(res.erro || "Falha ao gerar sugestões.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setGerando(false);
    }
  }

  async function handleAdicionar(sugestao: SugestaoKW) {
    const formData = new FormData();
    formData.set("keyword", sugestao.palavra);
    formData.set("tipo", sugestao.tipo);
    await adicionarKeyword(formData);
    setAdicionadas((prev) => new Set([...prev, sugestao.palavra]));
    toast.success(`"${sugestao.palavra}" adicionada!`);
  }

  return (
    <div className="glass-card p-6 border border-sucesso/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sucesso/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sucesso" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Sugestão IA</h3>
            <p className="text-xs text-muted-foreground">Keywords personalizadas para seu negócio</p>
          </div>
        </div>
        <button
          onClick={handleGerar}
          disabled={gerando}
          className="px-4 py-2 rounded-lg bg-sucesso hover:bg-sucesso/90 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-sucesso/25"
        >
          {gerando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {gerando ? "Analisando..." : "Gerar Sugestões"}
        </button>
      </div>

      {sugestoes.length > 0 && (
        <div className="mt-4 space-y-2">
          {sugestoes.map((s, i) => {
            const tipo = tipoLabels[s.tipo] ?? tipoLabels.PRIMARY;
            const jaAdicionada = adicionadas.has(s.palavra);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-sucesso/30 transition-colors group">
                <span className="flex-1 text-sm font-medium">{s.palavra}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${tipo.cor}`}>{tipo.label}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:block max-w-[150px] truncate">{s.motivo}</span>
                <button
                  onClick={() => handleAdicionar(s)}
                  disabled={jaAdicionada}
                  className={`p-1.5 rounded-md text-sm transition-all shrink-0 ${
                    jaAdicionada
                      ? "text-sucesso bg-sucesso/10 cursor-default"
                      : "text-muted-foreground hover:text-sucesso hover:bg-sucesso/10"
                  }`}
                  title={jaAdicionada ? "Adicionada" : "Adicionar"}
                >
                  {jaAdicionada ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
