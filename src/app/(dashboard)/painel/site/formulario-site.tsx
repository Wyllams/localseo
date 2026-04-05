"use client";

import { useState, useTransition } from "react";
import { salvarConfiguracaoSite } from "./actions";
import { Rocket, Plus, X, Loader2, Sparkles } from "lucide-react";

interface PropsFormulario {
  nomeNegocio: string;
  categoria: string;
  telefoneExistente?: string | null;
  // Valores default para edição
  nichoDefault?: string | null;
  servicosDefault?: string[] | null;
  diferencialDefault?: string | null;
  tomVozDefault?: string | null;
  whatsappDefault?: string | null;
  imagemDestaqueDefault?: string | null;
}

/**
 * Formulário interativo de configuração do site IA.
 * Permite adicionar/remover serviços dinamicamente e disparar a geração com IA.
 */
export function FormularioSite({
  nomeNegocio,
  categoria,
  telefoneExistente,
  nichoDefault,
  servicosDefault,
  diferencialDefault,
  tomVozDefault,
  whatsappDefault,
  imagemDestaqueDefault,
}: PropsFormulario) {
  const [servicos, setServicos] = useState<string[]>(servicosDefault && servicosDefault.length > 0 ? servicosDefault : [""]);
  const [novoServico, setNovoServico] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  function adicionarServico() {
    const valor = novoServico.trim();
    if (!valor) return;
    if (servicos.length >= 6) return;
    setServicos((prev) => [...prev.filter(Boolean), valor]);
    setNovoServico("");
  }

  function removerServico(index: number) {
    setServicos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarServico();
    }
  }

  async function handleSubmit(formData: FormData) {
    // Inject servicos into form data
    const servicosFiltrados = servicos.filter(Boolean);
    formData.set("servicos", servicosFiltrados.join(","));

    startTransition(async () => {
      const resultado = await salvarConfiguracaoSite(formData);
      if (resultado?.erro) {
        setMensagem({ tipo: "erro", texto: resultado.erro });
      } else {
        setMensagem({
          tipo: "sucesso",
          texto: "Site gerado com sucesso! Já está no ar.",
        });
        setTimeout(() => {
          window.location.href = "/painel/site";
        }, 1000);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Nome do Negócio */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Nome do Negócio
        </label>
        <input
          type="text"
          name="nomeNegocio"
          defaultValue={nomeNegocio}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
        />
      </div>

      {/* Nicho */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Nicho / Segmento
        </label>
        <input
          type="text"
          name="nicho"
          defaultValue={nichoDefault || categoria.replace(/_/g, " ")}
          placeholder="Ex: Barbearia, Advocacia, Desentupidora..."
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
        />
      </div>

      {/* Serviços */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Seus Principais Serviços{" "}
          <span className="text-muted-foreground font-normal">
            (até 6)
          </span>
        </label>

        {/* Lista de tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {servicos.filter(Boolean).map((servico, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium"
            >
              {servico}
              <button
                type="button"
                onClick={() => removerServico(i)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {servicos.filter(Boolean).length < 6 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={novoServico}
              onChange={(e) => setNovoServico(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Corte Degradê, Barba..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
            />
            <button
              type="button"
              onClick={adicionarServico}
              className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Diferencial */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Qual é o seu diferencial competitivo?
        </label>
        <textarea
          name="diferencial"
          rows={3}
          defaultValue={diferencialDefault || ""}
          placeholder="Ex: 15 anos no mercado, estacionamento grátis, atendimento 24h..."
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all resize-none"
          required
        />
      </div>

      {/* Tom de Voz */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Tom de Voz do Site
        </label>
        <select
          name="tomVoz"
          defaultValue={tomVozDefault || "profissional"}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
        >
          <option value="profissional">🏢 Profissional / Sério</option>
          <option value="descontraido">😊 Descontraído / Amigável</option>
          <option value="agressivo">🔥 Agressivo Comercial</option>
        </select>
      </div>

      {/* Imagem de Destaque */}
      <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">
            URL da Imagem de Destaque <span className="text-muted-foreground font-normal">(Opcional)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Se você não colocar nenhuma imagem, a nossa <strong>Inteligência Artificial</strong> buscará uma imagem profissional de alta qualidade baseada no seu nicho! Se colocar, usaremos a sua.
          </p>
        </div>
        <input
          type="url"
          name="imagemDestaque"
          defaultValue={imagemDestaqueDefault || ""}
          placeholder="Ex: https://seusite.com.br/foto.jpg"
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          WhatsApp para Agendamentos
        </label>
        <input
          type="tel"
          name="whatsapp"
          defaultValue={telefoneExistente || ""}
          placeholder="(85) 99999-9999"
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
        />
      </div>

      {/* Feedback */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            mensagem.tipo === "sucesso"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Botão de Geração */}
      <button
        type="submit"
        disabled={isPending || servicos.filter(Boolean).length === 0}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white text-base gradient-primary hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando com IA... aguarde
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Gerar Site com IA
          </>
        )}
      </button>
    </form>
  );
}
