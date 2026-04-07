"use client";

import { useState, useTransition } from "react";
import { formatarData } from "@/lib/utils";
import {
  Bot,
  Check,
  Clock,
  Search,
  ExternalLink,
  Star,
  Send,
  Pencil,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { gerarRespostaComIA, publicarResposta } from "./actions";
import { cn } from "@/lib/utils";

interface PropsTabela {
  avaliacoes: any[];
  negocioId: string;
}

type FiltroSentimento = "TODAS" | "POSITIVO" | "NEGATIVO" | "NEUTRO";
type FiltroStatus = "TODAS" | "PENDENTES" | "RESPONDIDAS";
type FiltroNota = 0 | 1 | 2 | 3 | 4 | 5; // 0 = todas

export function TabelaAvaliacoes({ avaliacoes, negocioId }: PropsTabela) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODAS");
  const [filtroSentimento, setFiltroSentimento] = useState<FiltroSentimento>("TODAS");
  const [filtroNota, setFiltroNota] = useState<FiltroNota>(0);

  // Estado de resposta inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoResposta, setTextoResposta] = useState("");
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [publicandoId, setPublicandoId] = useState<string | null>(null);

  // Filtros combinados
  const filtradas = avaliacoes.filter((a) => {
    if (filtroStatus === "PENDENTES" && a.respondido) return false;
    if (filtroStatus === "RESPONDIDAS" && !a.respondido) return false;
    if (filtroSentimento !== "TODAS" && a.sentimento !== filtroSentimento) return false;
    if (filtroNota > 0 && a.nota !== filtroNota) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        (a.autor && a.autor.toLowerCase().includes(q)) ||
        (a.texto && a.texto.toLowerCase().includes(q))
      );
    }
    return true;
  });

  async function handleGerarResposta(id: string) {
    try {
      setGerandoId(id);
      const res = await gerarRespostaComIA(id);

      if (res.sucesso && res.resposta) {
        // Abre o editor inline com a sugestão da IA
        setEditandoId(id);
        setTextoResposta(res.resposta);
        toast.success("Sugestão da IA gerada! Revise e publique.");
      } else {
        toast.error(res.erro || "Falha ao gerar resposta.");
      }
    } catch {
      toast.error("Erro inesperado de rede.");
    } finally {
      setGerandoId(null);
    }
  }

  async function handlePublicar(id: string) {
    try {
      setPublicandoId(id);
      const res = await publicarResposta(id, textoResposta);

      if (res.sucesso) {
        toast.success("Resposta publicada com sucesso! ✅");
        setEditandoId(null);
        setTextoResposta("");
      } else {
        toast.error(res.erro || "Falha ao publicar.");
      }
    } catch {
      toast.error("Erro inesperado.");
    } finally {
      setPublicandoId(null);
    }
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setTextoResposta("");
  }

  // Sentimento badge
  function SentimentoBadge({ sentimento }: { sentimento: string | null }) {
    if (!sentimento) return null;
    const configs: Record<string, { cor: string; icone: React.ReactNode; label: string }> = {
      POSITIVO: {
        cor: "bg-sucesso/10 text-sucesso border-sucesso/20",
        icone: <ThumbsUp className="w-3 h-3" />,
        label: "Positivo",
      },
      NEGATIVO: {
        cor: "bg-destructive/10 text-destructive border-destructive/20",
        icone: <ThumbsDown className="w-3 h-3" />,
        label: "Negativo",
      },
      NEUTRO: {
        cor: "bg-muted text-muted-foreground border-border",
        icone: <Minus className="w-3 h-3" />,
        label: "Neutro",
      },
    };
    const cfg = configs[sentimento];
    if (!cfg) return null;

    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border", cfg.cor)}>
        {cfg.icone}
        {cfg.label}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Barra de Filtros */}
      <div className="p-4 border-b border-border bg-muted/10 space-y-3">
        {/* Linha 1: Busca + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cliente ou trecho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
          <div className="flex bg-muted rounded-lg p-1">
            {(["TODAS", "PENDENTES", "RESPONDIDAS"] as FiltroStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filtroStatus === f
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "TODAS" ? "Todas" : f === "PENDENTES" ? "Pendentes" : "Respondidas"}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 2: Filtros avançados */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          
          {/* Filtro por sentimento */}
          {(["TODAS", "POSITIVO", "NEGATIVO", "NEUTRO"] as FiltroSentimento[]).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroSentimento(s)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors",
                filtroSentimento === s
                  ? s === "POSITIVO" ? "bg-sucesso/10 text-sucesso border-sucesso/20"
                    : s === "NEGATIVO" ? "bg-destructive/10 text-destructive border-destructive/20"
                    : s === "NEUTRO" ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {s === "TODAS" ? "Sentimento" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}

          <span className="text-border">|</span>

          {/* Filtro por nota */}
          {([0, 5, 4, 3, 2, 1] as FiltroNota[]).map((n) => (
            <button
              key={n}
              onClick={() => setFiltroNota(n)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors flex items-center gap-1",
                filtroNota === n
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {n === 0 ? (
                "Todas ★"
              ) : (
                <>
                  {n} <Star className="w-3 h-3 fill-current" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/5">
        {filtradas.length} avaliação{filtradas.length !== 1 ? "ões" : ""} encontrada{filtradas.length !== 1 ? "s" : ""}
      </div>

      {/* Lista de Avaliações */}
      <div className="divide-y divide-border">
        {filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Ajuste os filtros ou sincronize com o Google para buscar novas avaliações.
            </p>
          </div>
        ) : (
          filtradas.map((av) => (
            <div
              key={av.id}
              className={cn(
                "p-5 sm:p-6 transition-colors",
                editandoId === av.id ? "bg-primary/5" : "hover:bg-muted/10",
                !av.respondido && av.sentimento === "NEGATIVO" && "border-l-2 border-l-destructive"
              )}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Esquerda: Avaliação */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {av.autor?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{av.autor || "Cliente Google"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatarData(av.publicadoEm)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((estrela) => (
                        <Star
                          key={estrela}
                          className={cn(
                            "w-4 h-4",
                            estrela <= av.nota
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Texto */}
                  {av.texto ? (
                    <p className="text-sm text-foreground/85 leading-relaxed pl-12">
                      &ldquo;{av.texto}&rdquo;
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic pl-12">
                      Avaliação sem comentário de texto.
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 pl-12">
                    <SentimentoBadge sentimento={av.sentimento} />
                    {av.googleReviewId && (
                      <a
                        href="#"
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver no Google
                      </a>
                    )}
                  </div>
                </div>

                {/* Direita: Ação / Resposta */}
                <div className="lg:w-[340px] flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-border/50 pt-4 lg:pt-0 lg:pl-5">
                  {av.respondido && editandoId !== av.id ? (
                    /* Resposta publicada */
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-sucesso">
                        <Check className="w-4 h-4" />
                        Respondido
                        <span className="text-muted-foreground font-normal ml-1">
                          {av.respondidoEm && formatarData(av.respondidoEm)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50 leading-relaxed">
                        {av.textoResposta}
                      </div>
                    </div>
                  ) : editandoId === av.id ? (
                    /* Editor inline */
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                        Editando resposta
                      </div>
                      <textarea
                        value={textoResposta}
                        onChange={(e) => setTextoResposta(e.target.value)}
                        rows={4}
                        className="w-full text-sm p-3 rounded-lg bg-card border border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                        placeholder="Edite a resposta sugerida pela IA..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePublicar(av.id)}
                          disabled={publicandoId === av.id || textoResposta.trim().length < 5}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 gradient-primary text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/25"
                        >
                          {publicandoId === av.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Publicar
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Edite a sugestão antes de publicar. A resposta será salva no banco e futuramente enviada ao Google.
                      </p>
                    </div>
                  ) : (
                    /* Botões de ação */
                    <div className="flex flex-col items-stretch gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                        <Clock className="w-4 h-4" />
                        Aguardando resposta
                      </div>

                      {/* Gerar com IA */}
                      <button
                        onClick={() => handleGerarResposta(av.id)}
                        disabled={gerandoId === av.id || !av.texto}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-card border border-primary/30 hover:border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-medium transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {gerandoId === av.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                        {gerandoId === av.id ? "Gerando..." : "Gerar resposta com IA"}
                      </button>

                      {/* Escrever manualmente */}
                      <button
                        onClick={() => {
                          setEditandoId(av.id);
                          setTextoResposta("");
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Escrever manualmente
                      </button>

                      {!av.texto && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          Avaliações sem texto: use o botão manual.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
