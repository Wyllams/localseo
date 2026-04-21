import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analisarPerfilGmb } from "@/lib/agents/agente-perfil-gmb";
import {
  UserCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormPerfilGmb } from "./form-perfil-gmb";
import { ComparacaoGoogleLocal } from "./comparacao-google";

export default async function PaginaPerfilGmb() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  // Análise de completude do perfil
  const resultado = await analisarPerfilGmb({
    nome: negocioUser.nome,
    categoria: negocioUser.categoria,
    cidade: negocioUser.cidade,
    estado: negocioUser.estado ?? undefined,
    endereco: negocioUser.endereco ?? undefined,
    telefone: negocioUser.telefone ?? undefined,
    website: negocioUser.website ?? undefined,
    descricao: negocioUser.descricao ?? undefined,
    logoUrl: negocioUser.logoUrl ?? undefined,
    gmbConectado: !!negocioUser.gmbLocalId,
  });

  const scoreColor =
    resultado.score >= 80
      ? "text-sucesso"
      : resultado.score >= 50
        ? "text-amber-500"
        : "text-destructive";

  const strokeColor =
    resultado.score >= 80
      ? "stroke-sucesso"
      : resultado.score >= 50
        ? "stroke-amber-500"
        : "stroke-destructive";

  const gmbConectado = !!negocioUser.gmbLocalId;
  const scConectado = negocioUser.scConectado;
  const preenchidos = resultado.campos.filter((c) => c.preenchido).length;
  const totalCampos = resultado.campos.length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Perfil Google Meu Negócio
          </h1>
          <p className="text-muted-foreground mt-1">
            Analise, edite e otimize seu perfil para máxima visibilidade local.
          </p>
        </div>
        <a
          href="/painel/configuracoes"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          Configurações
        </a>
      </div>

      {/* Linha 1: Score + Status de Conexão + Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score circular */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center border border-border">
          <div className="relative w-28 h-28 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="50"
                fill="none" stroke="hsl(var(--muted))" strokeWidth="10"
              />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                strokeWidth="10"
                strokeDasharray={`${(resultado.score / 100) * 314} 314`}
                strokeLinecap="round"
                className={strokeColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-3xl font-bold", scoreColor)}>
                {resultado.score}%
              </span>
            </div>
          </div>
          <h2 className="font-bold">Completude</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {preenchidos}/{totalCampos} campos preenchidos
          </p>
        </div>

        {/* Status GMB */}
        <div className={cn(
          "glass-card p-6 border flex flex-col justify-between",
          gmbConectado ? "border-sucesso/30 bg-sucesso/5" : "border-amber-500/30 bg-amber-500/5"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Google Meu Negócio
            </span>
            {gmbConectado ? (
              <Wifi className="w-5 h-5 text-sucesso" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <p className={cn("text-lg font-bold", gmbConectado ? "text-sucesso" : "text-amber-500")}>
            {gmbConectado ? "Conectado" : "Não Conectado"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gmbConectado
              ? "Reviews, posts e analytics sincronizados."
              : "Conecte em Configurações para desbloquear dados reais."}
          </p>
          {!gmbConectado && (
            <a
              href="/painel/configuracoes"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Link2 className="w-3 h-3" />
              Conectar agora
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Status Search Console */}
        <div className={cn(
          "glass-card p-6 border flex flex-col justify-between",
          scConectado ? "border-sucesso/30 bg-sucesso/5" : "border-border"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Search Console
            </span>
            {scConectado ? (
              <Wifi className="w-5 h-5 text-sucesso" />
            ) : (
              <WifiOff className="w-5 h-5 text-muted-foreground/50" />
            )}
          </div>
          <p className={cn("text-lg font-bold", scConectado ? "text-sucesso" : "text-muted-foreground")}>
            {scConectado ? "Conectado" : "Não Conectado"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {scConectado
              ? `Site: ${negocioUser.scSiteUrl || "configurado"}`
              : "Necessário para dados de ranking e analytics."}
          </p>
          {!scConectado && (
            <a
              href="/painel/configuracoes"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Link2 className="w-3 h-3" />
              Conectar
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Linha 2: Checklist de Campos */}
      <div className="glass-card p-6 border border-border">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-primary" />
          Checklist do Perfil
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {preenchidos}/{totalCampos} completos
          </span>
        </h3>
        {/* Barra de progresso geral */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              resultado.score >= 80 ? "bg-sucesso" : resultado.score >= 50 ? "bg-amber-500" : "bg-destructive"
            )}
            style={{ width: `${resultado.score}%` }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resultado.campos.map((campo) => (
            <div
              key={campo.campo}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                campo.preenchido
                  ? "bg-sucesso/5 border-sucesso/20"
                  : "bg-destructive/5 border-destructive/20"
              )}
            >
              {campo.preenchido ? (
                <CheckCircle2 className="w-5 h-5 text-sucesso shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{campo.label}</p>
                {campo.valor && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {campo.valor}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 font-semibold">
                {campo.peso} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendações */}
      {resultado.recomendacoes.length > 0 && (
        <div className="glass-card p-6 border border-amber-500/20 bg-amber-500/5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-500">
            <Sparkles className="w-5 h-5" />
            Recomendações ({resultado.recomendacoes.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resultado.recomendacoes.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-background/50 border border-amber-500/10 text-sm text-foreground/80 leading-relaxed"
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparação Google vs Local — só aparece se GMB conectado */}
      {gmbConectado && !negocioUser.gmbContaId?.includes("sandbox") && (
        <ComparacaoGoogleLocal
          dadosLocais={{
            nome: negocioUser.nome,
            endereco: negocioUser.endereco,
            telefone: negocioUser.telefone,
            website: negocioUser.website,
          }}
        />
      )}

      {/* Linha 3: Formulário de Edição */}
      <FormPerfilGmb
        negocio={{
          nome: negocioUser.nome,
          categoria: negocioUser.categoria,
          cidade: negocioUser.cidade,
          estado: negocioUser.estado,
          endereco: negocioUser.endereco,
          telefone: negocioUser.telefone,
          website: negocioUser.website,
          descricao: negocioUser.descricao,
        }}
      />
    </div>
  );
}
