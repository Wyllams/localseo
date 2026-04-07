"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  MapPin,
  Phone,
  Globe,
  FileText,
  Store,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { atualizarPerfilNegocio, gerarESalvarDescricaoIA } from "./actions";
import { cn } from "@/lib/utils";

interface DadosNegocio {
  nome: string;
  categoria: string;
  cidade: string;
  estado: string | null;
  endereco: string | null;
  telefone: string | null;
  website: string | null;
  descricao: string | null;
}

export function FormPerfilGmb({ negocio }: { negocio: DadosNegocio }) {
  const [nome, setNome] = useState(negocio.nome);
  const [endereco, setEndereco] = useState(negocio.endereco || "");
  const [telefone, setTelefone] = useState(negocio.telefone || "");
  const [website, setWebsite] = useState(negocio.website || "");
  const [descricao, setDescricao] = useState(negocio.descricao || "");

  const [salvando, setSalvando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Detecta mudanças
  const temAlteracoes =
    nome !== negocio.nome ||
    endereco !== (negocio.endereco || "") ||
    telefone !== (negocio.telefone || "") ||
    website !== (negocio.website || "") ||
    descricao !== (negocio.descricao || "");

  async function handleSalvar() {
    try {
      setSalvando(true);
      const res = await atualizarPerfilNegocio({
        nome,
        endereco,
        telefone,
        website,
        descricao,
      });

      if (res.sucesso) {
        toast.success("Perfil atualizado com sucesso! ✅");
      } else {
        toast.error(res.erro || "Erro ao salvar.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleGerarDescricaoIA() {
    try {
      setGerandoIA(true);
      const res = await gerarESalvarDescricaoIA();

      if (res.sucesso && res.descricao) {
        setDescricao(res.descricao);
        toast.success("Descrição gerada pela IA! Revise e salve.");
      } else {
        toast.error(res.erro || "Falha ao gerar.");
      }
    } catch {
      toast.error("Erro de rede.");
    } finally {
      setGerandoIA(false);
    }
  }

  async function handleCopiarDescricao() {
    if (!descricao) return;
    await navigator.clipboard.writeText(descricao);
    setCopiado(true);
    toast.success("Descrição copiada!");
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Formulário principal */}
      <div className="glass-card p-6 border border-border space-y-5">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Informações do Negócio
        </h3>

        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3 h-3" />
            Nome do Negócio
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
          />
        </div>

        {/* Categoria + Localização (read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categoria
            </label>
            <div className="px-4 py-2.5 rounded-lg bg-muted/20 border border-border text-sm text-muted-foreground">
              {negocio.categoria}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cidade / Estado
            </label>
            <div className="px-4 py-2.5 rounded-lg bg-muted/20 border border-border text-sm text-muted-foreground">
              {negocio.cidade}{negocio.estado ? ` - ${negocio.estado}` : ""}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            Endereço Completo
          </label>
          <input
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, bairro, complemento..."
            className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Telefone + Website */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(81) 99999-9999"
              className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.meunegocio.com.br"
              className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-muted-foreground">
            {temAlteracoes ? "Alterações não salvas" : "Nenhuma alteração"}
          </p>
          <button
            onClick={handleSalvar}
            disabled={salvando || !temAlteracoes}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              temAlteracoes
                ? "gradient-primary text-white hover:shadow-lg hover:shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Descrição do Negócio — Seção separada */}
      <div className="glass-card p-6 border border-primary/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Descrição do Negócio
          </h3>
          <div className="flex items-center gap-2">
            {descricao && (
              <button
                onClick={handleCopiarDescricao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {copiado ? <Check className="w-3 h-3 text-sucesso" /> : <Copy className="w-3 h-3" />}
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            )}
            <button
              onClick={handleGerarDescricaoIA}
              disabled={gerandoIA}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {gerandoIA ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {gerandoIA ? "Gerando..." : "Gerar com IA"}
            </button>
          </div>
        </div>

        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          placeholder="Descreva seu negócio para o Google Meu Negócio... Use o botão 'Gerar com IA' para uma descrição otimizada."
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none leading-relaxed placeholder:text-muted-foreground/40"
        />

        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[11px]",
            descricao.length > 750 ? "text-destructive" : "text-muted-foreground"
          )}>
            {descricao.length}/750 caracteres
          </span>
          <p className="text-[11px] text-muted-foreground">
            Cole esta descrição no Google Meu Negócio para melhorar visibilidade.
          </p>
        </div>
      </div>
    </div>
  );
}
