import Link from "next/link";
import { Lock, Sparkles, ArrowUpRight } from "lucide-react";
import type { AcessoPlano } from "@/lib/planos";
import { getNomePlano, planoMinimo } from "@/lib/planos";

interface FeatureGateProps {
  feature: keyof AcessoPlano;
  /** Se true, o conteúdo é liberado */
  liberado: boolean;
  /** Opcional — descrição da feature */
  descricao?: string;
  /** Conteúdo a ser exibido quando liberado */
  children: React.ReactNode;
}

/**
 * Componente de bloqueio de features.
 * Exibe uma tela premium quando o plano do usuário não tem acesso à feature.
 */
export function FeatureGate({ feature, liberado, descricao, children }: FeatureGateProps) {
  if (liberado) return <>{children}</>;

  const planoNecessario = planoMinimo(feature);
  const nomePlano = getNomePlano(planoNecessario);

  return (
    <div className="glass-card border border-border p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Ícone */}
      <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-primary" />
      </div>

      {/* Texto */}
      <h3 className="text-xl font-bold relative z-10 mb-2">
        Recurso Premium
      </h3>
      <p className="text-muted-foreground max-w-md relative z-10 mb-6">
        {descricao || "Esta funcionalidade está disponível a partir do plano superior. Faça o upgrade para desbloquear."}
      </p>

      {/* Badge do plano necessário */}
      <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
        <Sparkles className="w-4 h-4" />
        Requer plano {nomePlano} ou superior
      </div>

      {/* CTA */}
      <Link
        href="/painel/cobranca"
        className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
      >
        Fazer Upgrade
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
