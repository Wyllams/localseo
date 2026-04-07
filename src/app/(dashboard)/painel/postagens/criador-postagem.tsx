"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Tag,
  Search,
  Megaphone,
  Gift,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  gerarRascunhoPostIA,
  salvarPostagem,
  buscarPalavrasChave,
} from "./actions";
import { cn } from "@/lib/utils";

const TIPOS_POST = [
  { value: "NOVIDADE" as const, label: "Novidade", icone: Megaphone, cor: "text-primary" },
  { value: "OFERTA" as const, label: "Oferta", icone: Gift, cor: "text-sucesso" },
  { value: "EVENTO" as const, label: "Evento", icone: CalendarDays, cor: "text-amber-500" },
];

export function CriadorPostagem() {
  const [instrucao, setInstrucao] = useState("");
  const [tipo, setTipo] = useState<"NOVIDADE" | "OFERTA" | "EVENTO">("NOVIDADE");
  const [kwSelecionada, setKwSelecionada] = useState("");
  const [keywords, setKeywords] = useState<{ id: string; palavra: string }[]>([]);

  // Estado do rascunho/preview
  const [rascunho, setRascunho] = useState<{
    conteudo: string;
    imagemUrl: string;
    tipo: string;
    palavraChave?: string;
  } | null>(null);
  const [conteudoEdit, setConteudoEdit] = useState("");

  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Buscar keywords ao montar
  useEffect(() => {
    buscarPalavrasChave().then(setKeywords);
  }, []);

  async function handleGerar() {
    try {
      setGerando(true);
      const res = await gerarRascunhoPostIA({
        instrucao: instrucao || undefined,
        tipo,
        palavraChave: kwSelecionada || undefined,
      });

      if (res.sucesso && res.rascunho) {
        setRascunho(res.rascunho);
        setConteudoEdit(res.rascunho.conteudo);
        toast.success("Rascunho gerado! Revise e publique.");
      } else {
        toast.error(res.erro || "Falha ao gerar.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setGerando(false);
    }
  }

  async function handleSalvar(publicar: boolean) {
    try {
      setSalvando(true);
      const res = await salvarPostagem({
        conteudo: conteudoEdit,
        imagemUrl: rascunho?.imagemUrl,
        tipo,
        palavraChave: kwSelecionada || undefined,
        publicar,
      });

      if (res.sucesso) {
        toast.success(
          publicar ? "Post publicado com sucesso! 🚀" : "Rascunho salvo!"
        );
        // Reset
        setRascunho(null);
        setConteudoEdit("");
        setInstrucao("");
      } else {
        toast.error(res.erro || "Falha ao salvar.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setSalvando(false);
    }
  }

  function cancelar() {
    setRascunho(null);
    setConteudoEdit("");
  }

  // Se tem rascunho, mostra preview
  if (rascunho) {
    return (
      <div className="glass-card border border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Pencil className="w-4 h-4" />
            Preview do Post
          </div>
          <button
            onClick={cancelar}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Imagem preview */}
        {rascunho.imagemUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rascunho.imagemUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold">
              {tipo}
            </div>
          </div>
        )}

        {/* Editor de texto */}
        <div className="p-5 space-y-4">
          <textarea
            value={conteudoEdit}
            onChange={(e) => setConteudoEdit(e.target.value)}
            rows={6}
            className="w-full text-sm p-3 rounded-lg bg-muted/30 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all leading-relaxed"
          />

          {/* Keyword badge */}
          {kwSelecionada && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" />
              Keyword: <span className="font-medium text-primary">{kwSelecionada}</span>
            </div>
          )}

          {/* Caracteres */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-[11px]",
              conteudoEdit.length > 1500 ? "text-destructive" : "text-muted-foreground"
            )}>
              {conteudoEdit.length}/1500 caracteres
            </span>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSalvar(true)}
              disabled={salvando || conteudoEdit.trim().length < 10}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 gradient-primary text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publicar
            </button>
            <button
              onClick={() => handleSalvar(false)}
              disabled={salvando || conteudoEdit.trim().length < 10}
              className="px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={cancelar}
              className="px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg text-sm font-medium transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de criação
  return (
    <div className="glass-card p-6 border border-primary/20 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Criar Post com IA</h2>
          <p className="text-xs text-muted-foreground">
            Gere conteúdo otimizado para SEO local
          </p>
        </div>
      </div>

      {/* Tipo de post */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tipo do post
        </label>
        <div className="flex gap-2">
          {TIPOS_POST.map((t) => {
            const Icon = t.icone;
            return (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all",
                  tipo === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyword selector */}
      {keywords.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            Palavra-chave (opcional)
          </label>
          <select
            value={kwSelecionada}
            onChange={(e) => setKwSelecionada(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">Nenhuma keyword específica</option>
            {keywords.map((kw) => (
              <option key={kw.id} value={kw.palavra}>
                {kw.palavra}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Instrução custom */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Instrução especial (opcional)
        </label>
        <textarea
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
          placeholder="Ex: Crie um post sobre promoção de Black Friday com 30% de desconto..."
          className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm min-h-[90px] outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          disabled={gerando}
        />
      </div>

      {/* Gerar */}
      <button
        onClick={handleGerar}
        disabled={gerando}
        className="w-full gradient-primary px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-white hover:shadow-lg hover:shadow-primary/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {gerando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando com IA...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Gerar Rascunho
          </>
        )}
      </button>
    </div>
  );
}
