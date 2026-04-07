"use client";

import { useState } from "react";
import {
  Trash2,
  Image as ImageIcon,
  Megaphone,
  Gift,
  CalendarDays,
  Tag,
  Eye,
  Clock,
  Search,
  Filter,
  Box,
  AlertCircle,
} from "lucide-react";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { excluirPostagem } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PropsLista {
  postagens: any[];
}

type FiltroStatus = "TODOS" | "PUBLICADO" | "RASCUNHO" | "AGENDADO" | "FALHOU";
type FiltroTipo = "TODOS" | "NOVIDADE" | "OFERTA" | "EVENTO";

const STATUS_CONFIG: Record<string, { label: string; cor: string }> = {
  PUBLICADO: { label: "Publicado", cor: "bg-sucesso/10 text-sucesso border-sucesso/20" },
  RASCUNHO: { label: "Rascunho", cor: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  AGENDADO: { label: "Agendado", cor: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  FALHOU: { label: "Falhou", cor: "bg-destructive/10 text-destructive border-destructive/20" },
};

const TIPO_CONFIG: Record<string, { label: string; icone: typeof Megaphone; cor: string }> = {
  NOVIDADE: { label: "Novidade", icone: Megaphone, cor: "text-primary" },
  OFERTA: { label: "Oferta", icone: Gift, cor: "text-sucesso" },
  EVENTO: { label: "Evento", icone: CalendarDays, cor: "text-amber-500" },
};

export function ListaPostagens({ postagens }: PropsLista) {
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [busca, setBusca] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const filtradas = postagens.filter((p) => {
    if (filtroStatus !== "TODOS" && p.status !== filtroStatus) return false;
    if (filtroTipo !== "TODOS" && p.tipo !== filtroTipo) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return p.conteudo?.toLowerCase().includes(q) || p.palavraChave?.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleExcluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    try {
      setExcluindoId(id);
      const res = await excluirPostagem(id);
      if (res.sucesso) {
        toast.success("Post excluído!");
      } else {
        toast.error(res.erro || "Falha ao excluir.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="glass-card border border-border overflow-hidden">
      {/* Barra de filtros */}
      <div className="p-4 border-b border-border bg-muted/10 space-y-3">
        {/* Linha 1: busca + status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar em posts..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
          <div className="flex bg-muted rounded-lg p-1">
            {(["TODOS", "PUBLICADO", "RASCUNHO", "AGENDADO"] as FiltroStatus[]).map((f) => (
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
                {f === "TODOS" ? "Todos" : STATUS_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 2: filtro tipo */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(["TODOS", "NOVIDADE", "OFERTA", "EVENTO"] as FiltroTipo[]).map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors",
                filtroTipo === t
                  ? t === "NOVIDADE" ? "bg-primary/10 text-primary border-primary/20"
                    : t === "OFERTA" ? "bg-sucesso/10 text-sucesso border-sucesso/20"
                    : t === "EVENTO" ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {t === "TODOS" ? "Tipo" : TIPO_CONFIG[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/5">
        {filtradas.length} post{filtradas.length !== 1 ? "s" : ""} encontrado{filtradas.length !== 1 ? "s" : ""}
      </div>

      {/* Grid de posts */}
      {filtradas.length === 0 ? (
        <div className="p-12 text-center">
          <Box className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum post encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Use o criador ao lado para gerar seu primeiro post com IA.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {filtradas.map((post) => {
            const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.RASCUNHO;
            const tipoCfg = TIPO_CONFIG[post.tipo] ?? TIPO_CONFIG.NOVIDADE;
            const TipoIcon = tipoCfg.icone;

            return (
              <div
                key={post.id}
                className={cn(
                  "bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group",
                  post.status === "FALHOU" ? "border-destructive/30" : "border-border"
                )}
              >
                {/* Imagem */}
                <div className="h-36 bg-muted relative w-full overflow-hidden flex items-center justify-center">
                  {post.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imagemUrl}
                      alt={post.imagemAlt || "Imagem do post"}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  )}
                  {/* Overlays */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold border backdrop-blur-md bg-background/70",
                        statusCfg.cor
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-md bg-background/70 border border-border">
                      <TipoIcon className={cn("w-3 h-3", tipoCfg.cor)} />
                      {tipoCfg.label}
                    </span>
                  </div>
                </div>

                {/* Corpo */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed line-clamp-4 mb-3">
                    {post.conteudo}
                  </p>

                  {/* Keyword badge */}
                  {post.palavraChave && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
                      <Tag className="w-3 h-3" />
                      {post.palavraChave}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatarData(post.criadoEm)}</span>
                      <span>• {tempoRelativo(post.criadoEm)}</span>
                    </div>
                    <button
                      onClick={() => handleExcluir(post.id)}
                      disabled={excluindoId === post.id}
                      className="p-1.5 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-30"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
