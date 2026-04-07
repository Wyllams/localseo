import Link from "next/link";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Search,
  Zap,
  BarChart3,
  FileText,
  Globe,
  ShieldCheck,
  Bot,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Target,
  ChevronRight,
} from "lucide-react";

const FUNCIONALIDADES = [
  {
    icone: Bot,
    titulo: "Respostas IA para Avaliações",
    desc: "A IA analisa o sentimento de cada avaliação e gera respostas inteligentes, educadas e estratégicas. Positivas, neutras ou negativas — tudo coberto automaticamente.",
    cor: "from-blue-500 to-cyan-400",
    bgCor: "bg-blue-500/10",
    txtCor: "text-blue-400",
  },
  {
    icone: FileText,
    titulo: "Postagens GMB Automáticas",
    desc: "Crie posts semanais otimizados para o Google Meu Negócio. Escolha o tipo (Oferta, Novidade, Evento), defina a palavra-chave e a IA escreve para você.",
    cor: "from-violet-500 to-purple-400",
    bgCor: "bg-violet-500/10",
    txtCor: "text-violet-400",
  },
  {
    icone: Globe,
    titulo: "Landing Pages de Alta Conversão",
    desc: "Gere páginas focadas em serviço + cidade com SEO técnico embutido (Schema JSON-LD, FAQ, meta tags). Zero programação necessária.",
    cor: "from-emerald-500 to-teal-400",
    bgCor: "bg-emerald-500/10",
    txtCor: "text-emerald-400",
  },
  {
    icone: Sparkles,
    titulo: "Blog SEO com IA (EEAT)",
    desc: "Artigos de 1500+ palavras escritos pela IA com estrutura EEAT, internal linking, FAQ embutido e tempo de leitura — prontos para ranquear.",
    cor: "from-amber-500 to-orange-400",
    bgCor: "bg-amber-500/10",
    txtCor: "text-amber-400",
  },
  {
    icone: TrendingUp,
    titulo: "Rank Tracking Local",
    desc: "Rastreie diariamente sua posição no Google Search e Maps para cada palavra-chave. Veja a evolução: de página 3 para o Top 3.",
    cor: "from-rose-500 to-pink-400",
    bgCor: "bg-rose-500/10",
    txtCor: "text-rose-400",
  },
  {
    icone: ShieldCheck,
    titulo: "Auditoria NAP Multi-Diretório",
    desc: "Garantia de consistência: verificamos se Nome, Endereço e Telefone são iguais em todos os guias online. Divergências = penalização do Google.",
    cor: "from-sky-500 to-blue-400",
    bgCor: "bg-sky-500/10",
    txtCor: "text-sky-400",
  },
  {
    icone: BarChart3,
    titulo: "Analytics & Search Console",
    desc: "Dados reais direto do Google: impressões, cliques, CTR e posição média. Tudo integrado em gráficos visuais no seu painel.",
    cor: "from-indigo-500 to-blue-400",
    bgCor: "bg-indigo-500/10",
    txtCor: "text-indigo-400",
  },
  {
    icone: Target,
    titulo: "Relatórios Executivos com Score IA",
    desc: "Score de Presença SEO (0-100) calculado em 4 pilares: GMB, Avaliações, Site/SEO e Blog. Gere PDFs para apresentar a sócios e investidores.",
    cor: "from-fuchsia-500 to-pink-400",
    bgCor: "bg-fuchsia-500/10",
    txtCor: "text-fuchsia-400",
  },
];

const PLANOS_LP = [
  {
    nome: "Starter",
    preco: "97",
    desc: "Ideal para começar a dominar sua região",
    recursos: [
      "Perfil GMB completo",
      "Respostas IA para avaliações",
      "Postagens GMB semanais",
      "1 Landing Page",
      "Relatórios mensais",
    ],
    destaque: false,
  },
  {
    nome: "Pro",
    preco: "197",
    desc: "Para quem quer escalar e dominar o topo",
    recursos: [
      "Tudo do Starter +",
      "Blog SEO com IA ilimitado",
      "Rank Tracking diário",
      "Palavras-chave ilimitadas",
      "NAP Check multi-diretório",
      "Analytics avançado",
      "Landing Pages ilimitadas",
    ],
    destaque: true,
  },
  {
    nome: "Pro+",
    preco: "297",
    desc: "Suporte dedicado e máxima performance",
    recursos: [
      "Tudo do Pro +",
      "Search Console integrado",
      "Relatórios semanais por e-mail",
      "Prioridade no suporte",
      "Consultoria SEO mensal",
      "White-label (em breve)",
    ],
    destaque: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="RikoSEO" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold tracking-tight">RikoSEO</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-44">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-teal-500/20 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-40 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute top-60 right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
          </div>
          {/* Grid pattern */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400 mb-8 animate-pulse">
              <Zap className="mr-2 h-4 w-4" />
              Plataforma de SEO Local com Inteligência Artificial
            </div>

            <h1 className="mx-auto max-w-5xl font-extrabold tracking-tight text-4xl sm:text-6xl lg:text-7xl mb-8 leading-[1.1]">
              Domine o{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400">
                Google Maps
              </span>{" "}
              da sua Cidade com{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-400">
                IA
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/50 mb-12 leading-relaxed">
              A RikoSEO é o seu departamento de marketing digital no{" "}
              <strong className="text-white/80">piloto automático</strong>. Respondemos avaliações, criamos posts, geramos sites, artigos e monitoramos sua posição — tudo sem você precisar fazer nada.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/login"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-1 transition-all duration-300"
              >
                Testar Grátis por 7 Dias
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#funcionalidades"
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white/70 rounded-full border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                Ver Funcionalidades
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              {[
                { valor: "+340%", label: "mais visibilidade" },
                { valor: "2.5x", label: "mais avaliações" },
                { valor: "24/7", label: "IA sempre ativa" },
                { valor: "Top 3", label: "Google Maps" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                    {stat.valor}
                  </p>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PROBLEMA / POR QUE ===== */}
        <section id="como-funciona" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/20 to-transparent -z-10" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">O Problema</p>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                Seus Clientes Estão Indo Para o Concorrente
              </h2>
              <p className="text-lg text-white/50 leading-relaxed">
                46% das buscas no Google têm intenção local. Quando alguém pesquisa &quot;dentista perto de mim&quot;, se você não aparece no Top 3 com boas avaliações, é como se não existisse.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icone: Search,
                  stat: "85%",
                  titulo: "Visitam em 24h",
                  desc: "dos clientes visitam ou ligam para uma empresa dentro de 24 horas após pesquisá-la no Google.",
                },
                {
                  icone: Star,
                  stat: "3x",
                  titulo: "Mais Confiança",
                  desc: "Empresas com +100 avaliações 5 estrelas geram 3x mais confiança e convertem muito mais cliques em vendas reais.",
                },
                {
                  icone: MessageSquare,
                  stat: "70%",
                  titulo: "Respondem Nunca",
                  desc: "dos negócios locais nunca respondem suas avaliações. O Google penaliza quem ignora — e premia quem responde.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:border-teal-500/30 hover:bg-teal-500/[0.03] transition-all duration-500"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 flex items-center justify-center">
                      <item.icone className="h-6 w-6 text-teal-400" />
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                      {item.stat}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.titulo}</h3>
                  <p className="text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FUNCIONALIDADES ===== */}
        <section id="funcionalidades" className="py-24 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">Funcionalidades</p>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                8 Agentes de IA Trabalhando Por Você
              </h2>
              <p className="text-lg text-white/50 leading-relaxed">
                Cada funcionalidade é um braço autônomo que opera 24/7. Desde responder avaliações até rastrear sua posição no mapa da cidade.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FUNCIONALIDADES.map((func, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1"
                >
                  <div className={`w-11 h-11 rounded-xl ${func.bgCor} flex items-center justify-center mb-5`}>
                    <func.icone className={`h-5 w-5 ${func.txtCor}`} />
                  </div>
                  <h3 className="text-base font-bold mb-2">{func.titulo}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{func.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== COMO FUNCIONA ===== */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/10 to-transparent -z-10" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">Simples de Usar</p>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                Configure em 5 Minutos
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { passo: "01", titulo: "Crie sua Conta", desc: "Login rápido com Google. Zero complicação." },
                { passo: "02", titulo: "Conecte seu GMB", desc: "Vincule o Google Meu Negócio em 1 clique." },
                { passo: "03", titulo: "Configure a IA", desc: "Defina categoria, cidade e palavras-chave." },
                { passo: "04", titulo: "Relaxe e Venda", desc: "A IA faz blog, posts, respostas e mais. Sozinha." },
              ].map((step, idx) => (
                <div key={idx} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                      {step.passo}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.titulo}</h3>
                  <p className="text-sm text-white/40">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PLANOS ===== */}
        <section id="planos" className="py-24 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-teal-600/5 rounded-full blur-3xl" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">Planos</p>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                Invista Menos que um Almoço por Dia
              </h2>
              <p className="text-lg text-white/50">
                Comece grátis por 7 dias. Sem cartão de crédito. Cancele a qualquer momento.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANOS_LP.map((plano, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                    plano.destaque
                      ? "bg-gradient-to-b from-teal-500/10 to-cyan-600/10 border-2 border-teal-500/30 shadow-2xl shadow-teal-500/10"
                      : "bg-white/[0.02] border border-white/5 hover:border-white/10"
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1">{plano.nome}</h3>
                  <p className="text-sm text-white/40 mb-6">{plano.desc}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-sm text-white/50">R$</span>
                    <span className="text-5xl font-black">{plano.preco}</span>
                    <span className="text-sm text-white/40">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plano.recursos.map((recurso, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        {recurso}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      plano.destaque
                        ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02]"
                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Começar Agora
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="py-24 relative">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-700" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

              <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 text-center">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
                  Pare de Perder Clientes para a Concorrência
                </h2>
                <p className="max-w-xl mx-auto text-lg text-white/70 mb-10 leading-relaxed">
                  Enquanto você lê isso, seus concorrentes estão sendo encontrados no Google. A RikoSEO coloca sua empresa no radar em minutos.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-bold text-teal-600 shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Ativar Minha IA Agora
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.png" alt="RikoSEO" className="h-7 w-7 rounded-md" />
              <span className="font-bold text-lg">RikoSEO</span>
            </div>
            <p className="text-sm text-white/30 text-center md:text-right">
              © {new Date().getFullYear()} RikoSEO Platform. Todos os direitos reservados.
              <br className="sm:hidden" /> Feito para negócios locais que querem dominar sua região.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
