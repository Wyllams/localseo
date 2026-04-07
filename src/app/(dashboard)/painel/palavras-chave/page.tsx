import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, palavrasChaveNegocio } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Search,
  Target,
  TrendingUp,
  Trash2,
  Plus,
  BarChart3,
  Zap,
  BookOpen,
} from "lucide-react";
import { getAcessoPlano } from "@/lib/planos";
import { FeatureGate } from "@/components/feature-gate";
import type { PlanoAssinatura } from "@/types";
import { adicionarKeyword, excluirKeyword } from "./actions";
import { SugestorKeywords } from "./sugestor-keywords";

export default async function PaginaPalavrasChave() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const acesso = getAcessoPlano((negocioUser.plano ?? "STARTER") as PlanoAssinatura);
  if (!acesso.palavrasChaveLiberado) {
    return (
      <FeatureGate
        feature="palavrasChaveLiberado"
        liberado={false}
        descricao="Descubra e rastreie as melhores palavras-chave para sua cidade usando a Inteligência Artificial. Disponível a partir do plano Pro."
      >
        <div />
      </FeatureGate>
    );
  }

  const keywords = await bd.query.palavrasChaveNegocio.findMany({
    where: eq(palavrasChaveNegocio.negocioId, negocioUser.id),
    orderBy: [desc(palavrasChaveNegocio.criadoEm)],
  });

  const tipoLabels: Record<string, { label: string; cor: string }> = {
    PRIMARY: { label: "Principal", cor: "bg-primary/10 text-primary border-primary/20" },
    SECONDARY: { label: "Secundária", cor: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    LONG_TAIL: { label: "Long Tail", cor: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    INFORMATIONAL: { label: "Informacional", cor: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    TRANSACTIONAL: { label: "Transacional", cor: "bg-sucesso/10 text-sucesso border-sucesso/20" },
  };

  const countByType = {
    primary: keywords.filter((k) => k.tipo === "PRIMARY").length,
    transactional: keywords.filter((k) => k.tipo === "TRANSACTIONAL").length,
    informational: keywords.filter((k) => k.tipo === "INFORMATIONAL").length,
    longTail: keywords.filter((k) => k.tipo === "LONG_TAIL").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Palavras-chave</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as keywords que a IA usa para gerar conteúdo e rastrear posições no Google.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Search className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold">{keywords.length}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Principais</span>
          </div>
          <p className="text-2xl font-bold">{countByType.primary}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-sucesso mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Transação</span>
          </div>
          <p className="text-2xl font-bold">{countByType.transactional}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Long Tail</span>
          </div>
          <p className="text-2xl font-bold">{countByType.longTail}</p>
        </div>
      </div>

      {/* IA Sugestor + Adicionar Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SugestorKeywords />

        <div className="glass-card p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Adicionar Manual</h3>
              <p className="text-xs text-muted-foreground">Insira uma keyword específica</p>
            </div>
          </div>
          <form action={adicionarKeyword} className="space-y-3 mt-4">
            <input
              name="keyword"
              type="text"
              placeholder="Ex: barbearia recife, dentista boa viagem..."
              className="w-full px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              required
              minLength={2}
            />
            <div className="flex gap-3">
              <select
                name="tipo"
                defaultValue="PRIMARY"
                className="flex-1 px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="PRIMARY">🎯 Principal</option>
                <option value="SECONDARY">🔵 Secundária</option>
                <option value="LONG_TAIL">🟣 Long Tail</option>
                <option value="INFORMATIONAL">🟡 Informacional</option>
                <option value="TRANSACTIONAL">🟢 Transacional</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg gradient-primary text-white font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lista de Keywords */}
      <div className="glass-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Suas Palavras-chave
          </h3>
          <span className="text-xs text-muted-foreground">{keywords.length} keywords</span>
        </div>
        {keywords.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma palavra-chave cadastrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Use a IA ou adicione manualmente para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keywords.map((kw) => {
              const tipo = tipoLabels[kw.tipo] ?? tipoLabels.PRIMARY;
              return (
                <div key={kw.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-medium">{kw.palavraChave}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${tipo.cor}`}>{tipo.label}</span>
                  {kw.volume && (
                    <span className="text-xs text-muted-foreground">Vol: {kw.volume}</span>
                  )}
                  {kw.dificuldade != null && (
                    <span className="text-xs text-muted-foreground">KD: {kw.dificuldade}</span>
                  )}
                  <form action={excluirKeyword}>
                    <input type="hidden" name="id" value={kw.id} />
                    <button
                      type="submit"
                      className="p-1.5 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
