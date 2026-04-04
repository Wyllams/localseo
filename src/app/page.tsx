import Link from 'next/link';
import { ArrowRight, Star, TrendingUp, Search, MapPin, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] font-sans text-neutral-900 dark:text-neutral-50 selection:bg-blue-500/30">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold tracking-tight">LocalSEO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Entrar
            </Link>
            <Link 
              href="/login" 
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#09090b]"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-neutral-50 to-neutral-50 dark:from-blue-900/10 dark:via-[#09090b] dark:to-[#09090b]"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 mb-8 transition-transform hover:scale-105">
              <Zap className="mr-2 h-4 w-4" />
              Ranqueie no topo do Google Maps da sua cidade
            </div>
            
            <h1 className="mx-auto max-w-4xl font-extrabold tracking-tight text-5xl sm:text-6xl lg:text-7xl mb-8">
              Transforme <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Avaliações</span> em Clientes Reais.
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-10 leading-relaxed">
              O Google Meu Negócio é a vitrine mais importante da atualidade. Nossa plataforma coleta <strong className="text-neutral-900 dark:text-white font-semibold">revisões 5 estrelas no automático</strong>, filtra clientes insatisfeitos e domina o SEO Local da sua região.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="flex w-full sm:w-auto flex-none items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1"
              >
                Automatizar meu Google
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a 
                href="#como-funciona" 
                className="flex w-full sm:w-auto items-center justify-center px-8 py-4 text-base font-semibold text-neutral-900 dark:text-white rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-all"
              >
                Como funciona
              </a>
            </div>

            <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800/50 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-900/30 px-4 py-2 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-800">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span>Crescimento de Avaliações Contínuo</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-900/30 px-4 py-2 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-800">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span>Até 300% mais visitas na loja (Fisica ou Digital)</span>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUE O GOOGLE É IMPORTANTE */}
        <section id="como-funciona" className="py-24 bg-white dark:bg-[#0a0a0c] border-y border-neutral-200 dark:border-neutral-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-white">
                Por que você está perdendo dinheiro?
              </h2>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                Seu cliente não acessa seu site primeiro e raramente cai no Instagram sem indicação. Ele pesquisa "X Perto de Mim" no Google Maps. Se o seu negócio não tem avaliações ou tem notas baixas, ele liga pro concorrente.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Search,
                  title: "Busca Rápida de Intenção Alta",
                  desc: "85% dos clientes visitam ou entram em contato com uma loja em até 24 horas após pesquisá-la no Google. Você só ganha se aparecer primeiro."
                },
                {
                  icon: Star,
                  title: "A Prova Social é a Rainha",
                  desc: "Empresas com mais de 100 avaliações 5 estrelas geram 3x mais confiança, convertem cliques em clientes facilmente e nunca mais sofrem por falta de orçamento."
                },
                {
                  icon: Zap,
                  title: "O Algoritmo Premia",
                  desc: "O sistema do Maps ranqueia melhor empresas que têm fluxo constante de novas avaliações e respondem ativamente todas elas. A LocalSEO faz isso 100% via IA."
                }
              ].map((item, idx) => (
                <div key={idx} className="relative group rounded-3xl border border-neutral-200 dark:border-neutral-800/80 p-8 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all duration-300 bg-neutral-50 dark:bg-[#0d0d10]">
                  <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 p-3.5 text-blue-600 dark:text-blue-400 shadow-inner">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="relative overflow-hidden py-24 sm:py-32 bg-neutral-50 dark:bg-[#09090b]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden px-6 py-16 sm:px-16 sm:py-24 text-center shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white mb-6">
                  Nós cuidamos da Reputação. Você foca em Vender.
                </h2>
                <p className="mx-auto max-w-xl text-lg text-blue-100 mb-10">
                  Um robô inteligente dispara SMS / E-mails pedindo avaliação nos momentos mágicos. Triamos pessoas insatisfeitas para o seu WhatsApp e levamos os 5-estrelas direto pro Google.
                </p>
                <div className="flex justify-center flex-col sm:flex-row gap-4">
                  <Link 
                    href="/login" 
                    className="rounded-full bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-xl hover:bg-neutral-50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Ativar Robô Agora <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#09090b] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            LocalSEO
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            © {new Date().getFullYear()} LocalSEO Platform. Todos os direitos reservados. Feito para negócios locais que querem dominar sua região.
          </p>
        </div>
      </footer>
    </div>
  );
}
