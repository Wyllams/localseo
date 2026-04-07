"use client";

import { useState } from "react";
import { TrendingUp, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { executarRastreamento } from "./actions";

export function RastreadorClient() {
  const [executando, setExecutando] = useState(false);

  async function handleExecutar() {
    setExecutando(true);
    try {
      const res = await executarRastreamento();
      if (res.sucesso && res.resultado) {
        toast.success(`Rastreamento concluído: ${res.resultado.novasEntradas} posições salvas.`);
        if (res.resultado.erros.length > 0) {
          toast.warning(res.resultado.erros.join(". "));
        }
      } else {
        toast.error(res.erro || "Falha ao rastrear.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setExecutando(false);
    }
  }

  return (
    <button
      onClick={handleExecutar}
      disabled={executando}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {executando ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Rastreando...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Rastrear Posições
        </>
      )}
    </button>
  );
}
