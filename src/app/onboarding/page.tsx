"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { CATEGORIAS, PLANOS } from "@/types";
import {
  MapPin,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ===== Tipos ===== */
interface DadosOnboarding {
  nome: string;
  categoria: string;
  cidade: string;
  estado: string;
  telefone: string;
  website: string;
  descricao: string;
  plano: string;
  palavrasChave: string[];
}

const ETAPAS = [
  { titulo: "Seu Negócio", icone: Building2 },
  { titulo: "Localização", icone: MapPin },
  { titulo: "Palavras-chave", icone: Search },
  { titulo: "Escolha seu Plano", icone: CreditCard },
  { titulo: "Confirmação", icone: CheckCircle2 },
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

/**
 * Página de Onboarding — Formulário multi-step v2.
 * Inclui nova etapa de Palavras-chave SEO.
 */
export default function PaginaOnboarding() {
  const { data: sessao } = useSession();
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [dados, setDados] = useState<DadosOnboarding>({
    nome: "",
    categoria: "",
    cidade: "",
    estado: "",
    telefone: "",
    website: "",
    descricao: "",
    plano: "STARTER",
    palavrasChave: [],
  });

  // Estado para input de palavra-chave
  const [kwInput, setKwInput] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);

  function atualizarDados(campo: keyof DadosOnboarding, valor: string) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  }

  function adicionarPalavraChave(kw: string) {
    const normalizada = kw.trim().toLowerCase();
    if (
      normalizada.length >= 2 &&
      !dados.palavrasChave.includes(normalizada) &&
      dados.palavrasChave.length < 10
    ) {
      setDados((prev) => ({
        ...prev,
        palavrasChave: [...prev.palavrasChave, normalizada],
      }));
    }
    setKwInput("");
    setSugestoes([]);
  }

  function removerPalavraChave(kw: string) {
    setDados((prev) => ({
      ...prev,
      palavrasChave: prev.palavrasChave.filter((p) => p !== kw),
    }));
  }

  async function buscarSugestoes() {
    if (!dados.nome || !dados.categoria) return;

    setBuscandoSugestoes(true);
    try {
      const semente = dados.categoria
        .toLowerCase()
        .replace(/_/g, " ")
        .replace("salao de beleza", "salão de beleza");

      const queries = [
        `${semente} ${dados.cidade}`,
        `melhor ${semente} ${dados.cidade}`,
        `${semente} perto de mim`,
      ];

      const todasSugestoes: string[] = [];

      for (const q of queries) {
        try {
          const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(q)}`;
          const res = await fetch(url);
          if (res.ok) {
            const body = await res.json();
            if (Array.isArray(body) && Array.isArray(body[1])) {
              todasSugestoes.push(...(body[1] as string[]));
            }
          }
        } catch {
          // Silencia erros de CORS em dev
        }
      }

      // Deduplica
      const unicas = [...new Set(todasSugestoes)]
        .filter((s) => s.length > 3 && !dados.palavrasChave.includes(s.toLowerCase()))
        .slice(0, 8);

      setSugestoes(unicas);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setBuscandoSugestoes(false);
    }
  }

  function podeAvancar(): boolean {
    switch (etapaAtual) {
      case 0:
        return dados.nome.trim().length >= 3 && dados.categoria !== "";
      case 1:
        return dados.cidade.trim().length >= 2;
      case 2:
        return dados.palavrasChave.length >= 1;
      case 3:
        return dados.plano !== "";
      default:
        return true;
    }
  }

  async function concluirOnboarding() {
    try {
      setSalvando(true);

      const resposta = await fetch("/api/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.mensagem || "Erro ao criar negócio");
      }

      toast.success("Negócio criado com sucesso! 🎉");
      router.push("/painel");
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Erro inesperado. Tente novamente."
      );
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="RikoSEO" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg">RikoSEO</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Indicador de progresso */}
          <div className="flex items-center justify-between mb-12">
            {ETAPAS.map((etapa, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                    i <= etapaAtual
                      ? "gradient-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < etapaAtual ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <etapa.icone className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm font-medium hidden sm:block",
                    i <= etapaAtual ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {etapa.titulo}
                </span>
                {i < ETAPAS.length - 1 && (
                  <div
                    className={cn(
                      "w-6 lg:w-12 h-0.5 mx-2",
                      i < etapaAtual ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Conteúdo da etapa */}
          <div className="glass-card p-8 animate-fade-in">
            {/* ===== ETAPA 0: Dados do Negócio ===== */}
            {etapaAtual === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Sobre o seu negócio</h2>
                  <p className="text-muted-foreground mt-1">
                    Conte-nos sobre o seu negócio para personalizar a experiência
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium mb-2">
                      Nome do negócio *
                    </label>
                    <input
                      id="nome"
                      type="text"
                      placeholder="Ex: Barbearia do João"
                      value={dados.nome}
                      onChange={(e) => atualizarDados("nome", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium mb-2">
                      Categoria *
                    </label>
                    <select
                      id="categoria"
                      value={dados.categoria}
                      onChange={(e) => atualizarDados("categoria", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIAS.map((cat) => (
                        <option key={cat.valor} value={cat.valor}>
                          {cat.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="descricao" className="block text-sm font-medium mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="descricao"
                      rows={3}
                      placeholder="Breve descrição do seu negócio..."
                      value={dados.descricao}
                      onChange={(e) => atualizarDados("descricao", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== ETAPA 1: Localização ===== */}
            {etapaAtual === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Onde fica seu negócio?</h2>
                  <p className="text-muted-foreground mt-1">
                    Isso ajuda a otimizar seu SEO local
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cidade" className="block text-sm font-medium mb-2">
                        Cidade *
                      </label>
                      <input
                        id="cidade"
                        type="text"
                        placeholder="Ex: Recife"
                        value={dados.cidade}
                        onChange={(e) => atualizarDados("cidade", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="estado" className="block text-sm font-medium mb-2">
                        Estado
                      </label>
                      <select
                        id="estado"
                        value={dados.estado}
                        onChange={(e) => atualizarDados("estado", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">Selecione</option>
                        {ESTADOS_BR.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium mb-2">
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="telefone"
                      type="tel"
                      placeholder="(81) 99999-9999"
                      value={dados.telefone}
                      onChange={(e) => atualizarDados("telefone", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium mb-2">
                      Website atual (se tiver)
                    </label>
                    <input
                      id="website"
                      type="url"
                      placeholder="https://seunegocio.com.br"
                      value={dados.website}
                      onChange={(e) => atualizarDados("website", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== ETAPA 2: Palavras-chave ===== */}
            {etapaAtual === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Palavras-chave do seu negócio</h2>
                  <p className="text-muted-foreground mt-1">
                    Quais termos seus clientes buscam no Google? Adicione pelo menos 1.
                  </p>
                </div>

                {/* Input manual */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: barbearia recife, corte fade..."
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarPalavraChave(kwInput);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button
                    onClick={() => adicionarPalavraChave(kwInput)}
                    disabled={kwInput.trim().length < 2}
                    className="px-4 py-3 rounded-lg gradient-primary text-white font-medium text-sm disabled:opacity-30 transition-all hover:shadow-lg hover:shadow-primary/25"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Tags de palavras-chave */}
                {dados.palavrasChave.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dados.palavrasChave.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                      >
                        <Search className="w-3 h-3" />
                        {kw}
                        <button
                          onClick={() => removerPalavraChave(kw)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Botão Sugestões IA */}
                <div className="pt-2">
                  <button
                    onClick={buscarSugestoes}
                    disabled={buscandoSugestoes || !dados.categoria}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-all disabled:opacity-50"
                  >
                    {buscandoSugestoes ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Buscando sugestões...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Sugerir palavras-chave automaticamente
                      </>
                    )}
                  </button>
                </div>

                {/* Sugestões */}
                {sugestoes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sugestões do Google
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sugestoes.map((s) => (
                        <button
                          key={s}
                          onClick={() => adicionarPalavraChave(s)}
                          className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {dados.palavrasChave.length}/10 palavras-chave adicionadas. Essas palavras serão usadas para gerar conteúdo, rastrear ranking e otimizar seu perfil.
                </p>
              </div>
            )}

            {/* ===== ETAPA 3: Plano ===== */}
            {etapaAtual === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Escolha seu plano</h2>
                  <p className="text-muted-foreground mt-1">
                    Comece grátis por 7 dias. Cancele a qualquer momento.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANOS.map((plano) => (
                    <button
                      key={plano.id}
                      onClick={() => atualizarDados("plano", plano.id)}
                      className={cn(
                        "text-left p-5 rounded-xl border-2 transition-all duration-200",
                        dados.plano === plano.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30",
                        plano.destaque && "ring-1 ring-primary/30"
                      )}
                    >
                      {plano.destaque && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-3">
                          <Sparkles className="w-3 h-3" />
                          Mais popular
                        </span>
                      )}
                      <p className="font-bold text-lg">{plano.nome}</p>
                      <div className="flex items-baseline gap-1 mt-1 mb-3">
                        <span className="text-2xl font-bold">
                          R$ {plano.preco}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <ul className="space-y-2">
                        {plano.funcionalidades.slice(0, 4).map((func, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="w-4 h-4 text-sucesso flex-shrink-0 mt-0.5" />
                            {func}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== ETAPA 4: Confirmação ===== */}
            {etapaAtual === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Tudo pronto!</h2>
                  <p className="text-muted-foreground mt-1">
                    Confirme os dados abaixo e comece a usar
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Negócio</span>
                    <span className="text-sm font-medium">{dados.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <span className="text-sm font-medium">
                      {CATEGORIAS.find((c) => c.valor === dados.categoria)?.rotulo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Localização</span>
                    <span className="text-sm font-medium">
                      {dados.cidade}{dados.estado ? ` - ${dados.estado}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Palavras-chave</span>
                    <span className="text-sm font-medium text-primary">
                      {dados.palavrasChave.length} selecionadas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plano</span>
                    <span className="text-sm font-medium text-primary">
                      {PLANOS.find((p) => p.id === dados.plano)?.nome} — R${" "}
                      {PLANOS.find((p) => p.id === dados.plano)?.preco}/mês
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Usuário</span>
                    <span className="text-sm font-medium">
                      {sessao?.user?.name || sessao?.user?.email}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setEtapaAtual((prev) => Math.max(0, prev - 1))}
                disabled={etapaAtual === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {etapaAtual < ETAPAS.length - 1 ? (
                <button
                  onClick={() => setEtapaAtual((prev) => prev + 1)}
                  disabled={!podeAvancar()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium gradient-primary text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={concluirOnboarding}
                  disabled={salvando}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-sucesso text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-sucesso/25"
                >
                  {salvando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Começar agora
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
