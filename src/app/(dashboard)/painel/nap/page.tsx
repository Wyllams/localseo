import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, verificacoesNap } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
} from "lucide-react";
import { VerificadorNAPClient } from "./verificador-nap-client";
import { getAcessoPlano } from "@/lib/planos";
import { FeatureGate } from "@/components/feature-gate";
import type { PlanoAssinatura } from "@/types";
import { obterProximosFeriados, type FeriadoFormatado } from "@/lib/agents/agente-feriados";
import { formatarData } from "@/lib/utils";

export default async function PaginaNAP() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  const acesso = getAcessoPlano((negocioUser.plano ?? "STARTER") as PlanoAssinatura);
  if (!acesso.napLiberado) {
    return (
      <FeatureGate
        feature="napLiberado"
        liberado={false}
        descricao="O Verificador de NAP varre +20 diretórios locais para garantir consistência dos seus dados. Disponível a partir do plano Pro."
      >
        <div />
      </FeatureGate>
    );
  }

  // Buscar verificações anteriores
  const historicoNap = await bd.query.verificacoesNap.findMany({
    where: eq(verificacoesNap.negocioId, negocioUser.id),
    orderBy: [desc(verificacoesNap.verificadoEm)],
    limit: 15,
  });

  // Buscar próximos feriados
  let feriados: FeriadoFormatado[] = [];
  try {
    feriados = await obterProximosFeriados(5);
  } catch {
    // Silencia erro da API externa
  }

  // Métricas
  const totalVerificacoes = historicoNap.length;
  const consistentes = historicoNap.filter((v) => v.consistente).length;
  const inconsistentes = totalVerificacoes - consistentes;
  const ultimaVerificacao = historicoNap[0]?.verificadoEm;

  // Dados cadastrais
  const camposNAP = [
    { label: "Nome", valor: negocioUser.nome, icon: Building2, preenchido: !!negocioUser.nome },
    { label: "Endereço", valor: negocioUser.endereco, icon: MapPin, preenchido: !!negocioUser.endereco },
    { label: "Telefone", valor: negocioUser.telefone, icon: Phone, preenchido: !!negocioUser.telefone },
    { label: "Cidade", valor: negocioUser.cidade, icon: MapPin, preenchido: !!negocioUser.cidade },
    { label: "Estado", valor: negocioUser.estado, icon: MapPin, preenchido: !!negocioUser.estado },
    { label: "Website", valor: negocioUser.website, icon: Shield, preenchido: !!negocioUser.website },
  ];
  const camposPreenchidos = camposNAP.filter((c) => c.preenchido).length;

  const corProximidade: Record<string, string> = {
    HOJE: "bg-destructive/10 text-destructive border-destructive/20",
    AMANHA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    ESTA_SEMANA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    PROXIMO: "bg-primary/10 text-primary border-primary/20",
    FUTURO: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">NAP Check & Feriados</h1>
        <p className="text-muted-foreground mt-1">
          Verifique a consistência do Nome, Endereço e Telefone (NAP) e prepare-se para feriados.
        </p>
      </div>

      {/* Cards métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Verificações</span>
          </div>
          <p className="text-2xl font-bold">{totalVerificacoes}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-sucesso mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Consistentes</span>
          </div>
          <p className="text-2xl font-bold">{consistentes}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Inconsistentes</span>
          </div>
          <p className="text-2xl font-bold">{inconsistentes}</p>
        </div>
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Última</span>
          </div>
          <p className="text-sm font-bold mt-1">
            {ultimaVerificacao ? formatarData(ultimaVerificacao) : "Nunca"}
          </p>
        </div>
      </div>

      {/* Grid: Perfil NAP + Feriados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil NAP */}
        <div className="glass-card p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Perfil NAP Cadastrado
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              {camposPreenchidos}/{camposNAP.length} campos
            </span>
          </div>
          <div className="space-y-3">
            {camposNAP.map((campo) => {
              const Icon = campo.icon;
              return (
                <div key={campo.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <Icon className={`w-4 h-4 shrink-0 ${campo.preenchido ? "text-sucesso" : "text-muted-foreground/30"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{campo.label}</p>
                    <p className={`text-sm font-medium truncate ${campo.preenchido ? "" : "text-muted-foreground/50 italic"}`}>
                      {campo.valor || "Não cadastrado"}
                    </p>
                  </div>
                  {campo.preenchido ? (
                    <CheckCircle2 className="w-4 h-4 text-sucesso shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          {camposPreenchidos < camposNAP.length && (
            <p className="text-xs text-amber-500 mt-4 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Complete todos os campos para uma verificação NAP mais precisa.
            </p>
          )}
        </div>

        {/* Próximos Feriados */}
        <div className="glass-card p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Próximos Feriados
            </h3>
            <span className="text-xs text-muted-foreground">Brasil API</span>
          </div>
          {feriados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum feriado encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feriados.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${corProximidade[f.proximidade] || corProximidade.FUTURO}`}>
                  <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.nome}</p>
                    <p className="text-xs opacity-80 capitalize">{f.dataFormatada}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {f.proximidade === "HOJE" ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-destructive text-white">HOJE</span>
                    ) : f.proximidade === "AMANHA" ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500 text-white">Amanhã</span>
                    ) : (
                      <span className="text-xs font-medium">{f.diasRestantes}d</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {feriados.some((f) => f.diasRestantes <= 7) && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Feriado próximo! Atualize seus horários no Google Meu Negócio.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verificador NAP (Client Component) */}
      <VerificadorNAPClient />

      {/* Histórico */}
      {historicoNap.length > 0 && (
        <div className="glass-card border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Histórico de Verificações
            </h3>
          </div>
          <div className="divide-y divide-border">
            {historicoNap.map((v) => (
              <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                {v.consistente ? (
                  <CheckCircle2 className="w-4 h-4 text-sucesso shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm font-medium flex-1">{v.fonte}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${
                  v.consistente
                    ? "bg-sucesso/10 text-sucesso border-sucesso/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}>
                  {v.consistente ? "OK" : `${(v.problemas ?? []).length} problema(s)`}
                </span>
                <span className="text-xs text-muted-foreground">{formatarData(v.verificadoEm)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
