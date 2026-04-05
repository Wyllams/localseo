import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAcessoPlano } from "@/lib/planos";
import { Paywall } from "@/components/paywall";
import type { PlanoAssinatura } from "@/types";
import { FormularioSite } from "./formulario-site";
import { toggleSite, excluirSite } from "./actions";
import {
  Globe,
  ExternalLink,
  Pencil,
  Power,
  PowerOff,
  Sparkles,
  LayoutTemplate,
  Zap,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default async function PaginaSite({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const params = await searchParams;
  const modoEdicao = params.editar === "true";

  const sessao = await auth.api.getSession({ headers: await headers() });

  if (!sessao?.user?.id) {
    redirect("/login");
  }

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) {
    redirect("/onboarding");
  }

  // Verificar acesso pelo plano
  const acesso = getAcessoPlano(
    (negocioUser.plano ?? "INICIAL") as PlanoAssinatura
  );
  if (!acesso.siteLiberado) {
    return (
      <Paywall
        feature="Construtor de Site IA"
        planoMinimo="Pro"
        descricao="Crie uma Landing Page completa gerada por Inteligência Artificial, 100% otimizada para SEO local. Disponível a partir do plano Pro."
      />
    );
  }

  const siteConfigurado = !!(negocioUser.siteHeadline && negocioUser.siteServicos);
  const urlSite = `/site/${negocioUser.subdominio}`;

  // ============================
  // ESTADO 2: Site já configurado
  // ============================
  if (siteConfigurado && !modoEdicao) {
    const servicos = (negocioUser.siteServicos as string[] | null) ?? [];

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Meu Site
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua Landing Page gerada por IA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={urlSite}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              Visitar Site
            </Link>
          </div>
        </div>

        {/* Preview Card */}
        <div className="glass-card p-8 border border-border relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary" />

          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{negocioUser.nome}</h2>
                  <p className="text-xs text-muted-foreground">
                    {negocioUser.subdominio}.localseo.com.br
                  </p>
                </div>
              </div>

              {/* Headline Preview */}
              <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                  Headline (IA)
                </p>
                <p className="text-lg font-bold text-foreground leading-snug">
                  {negocioUser.siteHeadline}
                </p>
                {negocioUser.siteSubtitulo && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {negocioUser.siteSubtitulo}
                  </p>
                )}
              </div>

              {/* Serviços */}
              {servicos.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                    Serviços Exibidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {servicos.map((s, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {negocioUser.siteWhatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp: {negocioUser.siteWhatsapp}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 shrink-0 lg:w-52">
              {/* Status Badge */}
              <div
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${
                  negocioUser.siteAtivo
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {negocioUser.siteAtivo ? (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Site Ativo
                  </>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4" /> Site Desativado
                  </>
                )}
              </div>

              {/* Toggle */}
              <form action={toggleSite}>
                <input
                  type="hidden"
                  name="ativo"
                  value={negocioUser.siteAtivo ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    negocioUser.siteAtivo
                      ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                      : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  }`}
                >
                  {negocioUser.siteAtivo ? (
                    <>
                      <PowerOff className="w-4 h-4" /> Desativar
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" /> Ativar
                    </>
                  )}
                </button>
              </form>

              {/* Botões de Ação Extras */}
              <div className="pt-4 mt-2 border-t border-border/50 flex flex-col gap-3">
                <Link
                  href="/painel/site?editar=true"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Editar / Refazer
                </Link>

                <form action={excluirSite}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Site
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex items-start gap-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">SEO Automático</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Schema.org e meta tags são gerados automaticamente.
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Conteúdo Vivo</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Postagens GMB e artigos de blog aparecem automaticamente.
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-start gap-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Globe className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Domínio Próprio</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Em breve: conecte seu domínio .com.br ao site.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // ESTADO 1: Setup Inicial
  // ============================
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Construir Meu Site
        </h1>
        <p className="text-muted-foreground mt-1">
          Preencha as informações e a IA criará sua Landing Page em segundos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-3 glass-card p-6 sm:p-8 border border-border">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Setup do Site</h2>
              <p className="text-xs text-muted-foreground">
                A IA usará essas informações para gerar o conteúdo
              </p>
            </div>
          </div>

          <FormularioSite
            nomeNegocio={negocioUser.nome}
            categoria={negocioUser.categoria}
            telefoneExistente={negocioUser.telefone}
            nichoDefault={negocioUser.categoria} // Optional
            servicosDefault={(negocioUser.siteServicos as string[]) || []}
            diferencialDefault={negocioUser.siteDiferencial}
            tomVozDefault={negocioUser.siteTomVoz}
            whatsappDefault={negocioUser.siteWhatsapp}
            imagemDestaqueDefault={negocioUser.siteImagemDestaque}
          />
        </div>

        {/* Sidebar Informativa */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm">Como funciona?</span>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </span>
                <span>Você preenche os dados do seu negócio ao lado.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </span>
                <span>
                  A IA Gemini cria textos de alta conversão (headline +
                  descrição).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </span>
                <span>
                  Seu site vai ao ar instantaneamente, já puxando seus posts do
                  GMB e artigos de blog.
                </span>
              </li>
            </ol>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-sm mb-3">O que será gerado:</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Headline de impacto (otimizada para SEO)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Descrição persuasiva
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Seção de Serviços
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Botão de WhatsApp (CTA)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Feed automático de Postagens GMB
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Feed automático de Artigos de Blog
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Schema.org LocalBusiness (SEO técnico)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
