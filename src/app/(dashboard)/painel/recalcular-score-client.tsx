"use client";

import { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { recalcularScore } from "./actions";

export function RecalcularScoreClient() {
  const [executando, setExecutando] = useState(false);

  async function handleRecalcular() {
    setExecutando(true);
    try {
      const res = await recalcularScore();
      if (res.sucesso && res.resultado) {
        toast.success(`Score atualizado: ${res.resultado.total}/100`);
      } else {
        toast.error(res.erro || "Falha ao calcular.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setExecutando(false);
    }
  }

  return (
    <button
      onClick={handleRecalcular}
      disabled={executando}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {executando ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Calculando...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Recalcular Score
        </>
      )}
    </button>
  );
}
