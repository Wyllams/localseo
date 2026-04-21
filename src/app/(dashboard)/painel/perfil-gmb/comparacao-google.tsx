"use client";

import { useState, useEffect } from "react";
import { buscarDadosReaisGoogle } from "./actions";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DadosLocal {
  nome: string;
  endereco: string | null;
  telefone: string | null;
  website: string | null;
}

interface DadosGoogle {
  nome: string;
  endereco: string;
  telefone: string;
  website: string;
  categoria: string;
  status: string;
}

export function ComparacaoGoogleLocal({
  dadosLocais,
}: {
  dadosLocais: DadosLocal;
}) {
  const [loading, setLoading] = useState(false);
  const [google, setGoogle] = useState<DadosGoogle | null>(null);
  const [erro, setErro] = useState("");
  const [jaCarregou, setJaCarregou] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const res = await buscarDadosReaisGoogle();
      if (res.sucesso && res.google) {
        setGoogle(res.google);
      } else {
        setErro(res.erro || "Sem dados");
      }
    } catch {
      setErro("Erro ao buscar dados do Google.");
    }
    setLoading(false);
    setJaCarregou(true);
  }

  // Campos para comparar
  const campos = google
    ? [
        { label: "Nome", local: dadosLocais.nome, google: google.nome },
        {
          label: "Endereço",
          local: dadosLocais.endereco || "",
          google: google.endereco,
        },
        {
          label: "Telefone",
          local: dadosLocais.telefone || "",
          google: google.telefone,
        },
        {
          label: "Website",
          local: dadosLocais.website || "",
          google: google.website,
        },
      ]
    : [];

  const totalDivergencias = campos.filter(
    (c) =>
      c.local.toLowerCase().trim() !== c.google.toLowerCase().trim() &&
      c.google !== "Não informado"
  ).length;

  return (
    <div className="glass-card p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          Dados Local vs Google
        </h3>
        <button
          onClick={carregar}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {loading
            ? "Buscando..."
            : jaCarregou
              ? "Atualizar"
              : "Comparar com Google"}
        </button>
      </div>

      {erro && (
        <p className="text-xs text-muted-foreground">{erro}</p>
      )}

      {google && (
        <>
          {/* Badge de status */}
          <div className="mb-4">
            {totalDivergencias === 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dados sincronizados
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                {totalDivergencias} divergência{totalDivergencias > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Tabela de comparação */}
          <div className="space-y-2">
            {campos.map((campo) => {
              const match =
                campo.local.toLowerCase().trim() ===
                  campo.google.toLowerCase().trim() ||
                campo.google === "Não informado";
              return (
                <div
                  key={campo.label}
                  className={cn(
                    "grid grid-cols-[80px_1fr_1fr] gap-2 p-2.5 rounded-lg text-xs border",
                    match
                      ? "bg-muted/10 border-border/50"
                      : "bg-amber-500/5 border-amber-500/20"
                  )}
                >
                  <span className="font-semibold text-muted-foreground">
                    {campo.label}
                  </span>
                  <span className="truncate" title={campo.local}>
                    {campo.local || (
                      <span className="text-muted-foreground/50 italic">
                        vazio
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      !match && "text-amber-500 font-medium"
                    )}
                    title={campo.google}
                  >
                    {campo.google || (
                      <span className="text-muted-foreground/50 italic">
                        vazio
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {/* Header labels */}
            <div className="grid grid-cols-[80px_1fr_1fr] gap-2 px-2.5 pt-1 text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              <span />
              <span>Dados locais</span>
              <span>Dados no Google</span>
            </div>
          </div>

          {/* Categoria e status do Google */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Categoria:{" "}
              <span className="font-medium text-foreground">
                {google.categoria}
              </span>
            </span>
            <span>
              Status:{" "}
              <span
                className={cn(
                  "font-medium",
                  google.status === "OPEN"
                    ? "text-emerald-500"
                    : "text-amber-500"
                )}
              >
                {google.status === "OPEN" ? "Aberto" : google.status}
              </span>
            </span>
          </div>
        </>
      )}

      {!google && !erro && !loading && (
        <p className="text-xs text-muted-foreground">
          Clique em &quot;Comparar com Google&quot; para ver divergências entre
          seus dados locais e o que está publicado no Google.
        </p>
      )}
    </div>
  );
}
