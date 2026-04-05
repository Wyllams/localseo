import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, landingPages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAcessoPlano } from "@/lib/planos";
import { Paywall } from "@/components/paywall";
import type { PlanoAssinatura } from "@/types";
import { FormularioSite } from "./formulario-site";
import { toggleLandingPage, excluirLandingPage } from "./actions";
import {
  Globe,
  ExternalLink,
  Power,
  PowerOff,
  Sparkles,
  LayoutTemplate,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default async function PaginaLandingPages({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string }>;
}) {
  const params = await searchParams;
  const modoCriacao = params.criar === "true";

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
        feature="Construtor de Landing Pages IA"
        planoMinimo="Pro"
        descricao="Crie Landing Pages ilimitadas geradas por Inteligência Artificial focadas em serviços específicos. Disponível a partir do plano Pro."
      />
    );
  }

  const paginas = await bd.query.landingPages.findMany({
    where: eq(landingPages.negocioId, negocioUser.id),
    orderBy: [desc(landingPages.criadoEm)],
  });

  // ============================
  // ESTADO 2: MODO CRIAÇÃO (Ou primeira vez)
  // ============================
  if (modoCriacao || paginas.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {paginas.length === 0 ? "Construir Primeira Landing Page" : "Nova Landing Page"}
            </h1>
            <p className="text-muted-foreground mt-1">
              A IA criará uma página de alta conversão focada no seu serviço.
            </p>
          </div>
          {paginas.length > 0 && (
            <Link
              href="/painel/site"
              className="px-4 py-2 text-sm font-medium border rounded-xl hover:bg-muted"
            >
              Cancelar
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 glass-card p-6 sm:p-8 border border-border">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Setup da Página</h2>
                <p className="text-xs text-muted-foreground">
                  Foque a página num serviço que você quer vender
                </p>
              </div>
            </div>

            <FormularioSite
              nomeNegocio={negocioUser.nome}
              categoria={negocioUser.categoria}
              telefoneExistente={negocioUser.telefone}
              nichoDefault={negocioUser.categoria}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-sm">Como funciona?</span>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                  <span>Defina um "Serviço Foco" (ex: Implante, Corte Fade).</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                  <span>A IA Gemini cria uma copy inteira focada em vender esse serviço.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                  <span>A página vai ao ar em uma URL única vinculada a você.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // ESTADO 1: LISTAGEM DE LANDING PAGES
  // ============================
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Minhas Landing Pages
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas páginas de alta conversão. ({paginas.length} criadas)
          </p>
        </div>
        <Link
          href="/painel/site?criar=true"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nova Landing Page
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginas.map((lp) => {
          const urlSite = lp.isPrincipal
            ? `/site/${negocioUser.subdominio}`
            : `/site/${negocioUser.subdominio}/${lp.slug}`;
          const isAtivo = lp.ativo;

          return (
            <div
              key={lp.id}
              className={`glass-card border flex flex-col overflow-hidden relative ${
                isAtivo ? "border-border" : "border-destructive/30 opacity-75"
              }`}
            >
              {lp.isPrincipal && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow-sm">
                  PÁGINA PRINCIPAL
                </div>
              )}

              {/* Cover genérica ou Imagem da LP */}
              <div
                className="h-32 w-full bg-cover bg-center border-b border-border relative"
                style={{
                  backgroundImage: `url(${
                    lp.imagemDestaque ||
                    "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop"
                  })`,
                }}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <h3 className="text-white font-bold text-lg drop-shadow line-clamp-1">
                    {lp.servicoFoco}
                  </h3>
                  <span className="text-white/80 text-xs font-medium">/{lp.slug}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Headline (IA)
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-3">
                    {lp.headline}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                  <form action={toggleLandingPage} className="w-fit">
                    <input type="hidden" name="lpId" value={lp.id} />
                    <input
                      type="hidden"
                      name="ativo"
                      value={isAtivo ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isAtivo
                          ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                          : "border-destructive/30 text-destructive hover:bg-destructive/10"
                      }`}
                    >
                      {isAtivo ? (
                        <>
                          <Power className="w-3 h-3" /> Online
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3" /> Offline
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center gap-2">
                    <Link
                      href={urlSite}
                      target="_blank"
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Visitar Landing Page"
                    >
                      <Globe className="w-4 h-4" />
                    </Link>
                    <form action={excluirLandingPage}>
                      <input type="hidden" name="lpId" value={lp.id} />
                      <button
                        type="submit"
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Excluir Landing Page"
                        onClick={(e) => {
                          if (!confirm("Tem certeza que deseja excluir esta Landing Page?")) e.preventDefault();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
