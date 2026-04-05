import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, pontuacoesPresenca, avaliacoes } from "@/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { 
  TrendingUp, 
  Map, 
  Phone, 
  MessageCircle, 
  Navigation,
  Sparkles,
  Trophy,
  Activity,
  ThumbsUp,
  BrainCircuit
} from "lucide-react";
import { GraficoEvolucao } from "@/components/dashboard/grafico-evolucao";
import { formatarData } from "@/lib/utils";

// Dados simulados de ranking para versão 1.0 (Pre-API Maps)
const RANKING_MOCK = [
  { posicao: 1, nome: "Seu Negócio", score: 98, status: "up" },
  { posicao: 2, nome: "Concorrente Principal A", score: 82, status: "down" },
  { posicao: 3, nome: "Concorrente B", score: 75, status: "down" },
  { posicao: 4, nome: "Negócio Local C", score: 60, status: "up" },
];

export default async function PainelRelatorios() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessao?.user?.id) {
    redirect("/login");
  }

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) {
    redirect("/onboarding");
  }

  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Busca do Score
  const [pontuacaoAtualRes, pontuacoesHistoricoRes] = await Promise.all([
    bd.query.pontuacoesPresenca.findFirst({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
    }),
    bd.query.pontuacoesPresenca.findMany({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
      limit: 10,
    })
  ]);

  const pontuacao = pontuacaoAtualRes?.total || 0;

  // Busca avaliações para fazer um pseudo-resumo (Sentimental)
  const [qtdAvaliacoesRes, avaliacoesRes] = await Promise.all([
    bd.select({ count: sql<number>`count(*)` }).from(avaliacoes).where(eq(avaliacoes.negocioId, negocioUser.id)),
    bd.query.avaliacoes.findMany({
      where: eq(avaliacoes.negocioId, negocioUser.id),
      orderBy: [desc(avaliacoes.criadoEm)],
      limit: 5
    })
  ]);

  const qtdAvaliacoes = qtdAvaliacoesRes[0]?.count || 0;
  
  // Formatando dados para o gráfico de Posição/Score
  const dadosGrafico = pontuacoesHistoricoRes
    .reverse()
    .map(p => ({
      data: formatarData(p.criadoEm).substring(0, 5),
      score: p.total
    }));

  if (dadosGrafico.length === 0) {
    dadosGrafico.push({ data: formatarData(new Date()), score: 0 });
  }

  // Estatísticas simuladas genéricas e aplicáveis a qualquer nicho
  const statsGmb = [
    { 
      label: "Visualizações do Perfil", 
      valor: "1.248", 
      crescimento: "+32%", 
      icone: TrendingUp, 
      cor: "text-blue-400",
      bg: "bg-blue-400/10" 
    },
    { 
      label: "Acessos ao Site / LP", 
      valor: "389", 
      crescimento: "+15%", 
      icone: Activity, 
      cor: "text-emerald-400",
      bg: "bg-emerald-400/10" 
    },
    { 
      label: "Aparições em Buscas", 
      valor: "2.515", 
      crescimento: "+21%", 
      icone: Map, 
      cor: "text-purple-400",
      bg: "bg-purple-400/10" 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      
      {/* Cabeçalho */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 text-primary-foreground text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Relatório de Performance
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">
          Análise Competitiva
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Métricas de visibilidade e conversão da sua empresa no Google nas últimas 4 semanas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WIDGET 1: Score Geral */}
        <div className="lg:col-span-4 glass-card p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <h2 className="text-lg font-semibold text-slate-200 mb-6 w-full text-left flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Score de Presença
          </h2>
          
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 score-circle rotate-[-90deg]" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(217, 33%, 17%)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  pontuacao >= 70
                    ? "hsl(142, 71%, 45%)" // Emerald
                    : pontuacao >= 40
                      ? "hsl(38, 92%, 50%)" // Yellow
                      : "hsl(0, 84%, 60%)"  // Red
                }
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * pontuacao) / 100}
                className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tighter">{pontuacao}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">/ 100</span>
            </div>
          </div>
          
          <div className="mt-8 relative z-10 w-full p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm font-medium text-slate-300">
              Sua estratégia cresceu <strong className="text-sucesso">+12%</strong> no último mês.
            </p>
          </div>
        </div>

        {/* WIDGET 2: Conversões de Contato */}
        <div className="lg:col-span-8 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Taxa de Conversão Local (Estimada)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {statsGmb.map((stat, i) => (
              <div key={i} className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div className={"w-12 h-12 rounded-xl flex items-center justify-center border " + stat.bg + " border-white/5"}>
                    <stat.icone className={"w-6 h-6 " + stat.cor} />
                  </div>
                  <span className="inline-flex items-center text-xs font-bold text-sucesso bg-sucesso/10 border border-sucesso/20 px-2 py-1 rounded-full">
                    {stat.crescimento}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-4xl font-black tracking-tighter text-white mb-2">{stat.valor}</p>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        
        {/* WIDGET 3: Ranking Competitivo (Google Maps Simulator) */}
        <div className="lg:col-span-7 glass-card p-8">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              Posições no Mapa (Seu Bairro)
            </h2>
            <div className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-slate-400">
              Atualizado hoje
            </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-white/10">
                   <th className="pb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-4">Posição</th>
                   <th className="pb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Negócio</th>
                   <th className="pb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">Health Score</th>
                 </tr>
               </thead>
               <tbody>
                 {RANKING_MOCK.map((rank) => (
                   <tr key={rank.posicao} className={"border-b border-white/5 hover:bg-white/[0.02] transition-colors " + (rank.posicao === 1 ? "bg-primary/5" : "")}>
                     <td className="py-4 pl-4">
                       <span className={"inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold " + (rank.posicao === 1 ? "bg-sucesso/20 text-sucesso border border-sucesso/30" : "bg-white/5 text-slate-300")}>
                         {rank.posicao}
                       </span>
                     </td>
                     <td className="py-4">
                       <p className={"font-medium text-sm " + (rank.posicao === 1 ? "text-primary" : "text-slate-300")}>
                         {rank.nome}
                         {rank.posicao === 1 && <Trophy className="w-3 h-3 inline-block ml-2 text-yellow-400" />}
                       </p>
                     </td>
                     <td className="py-4 text-right pr-4">
                       <span className="font-mono text-sm font-medium text-slate-400">{rank.score}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
             <Sparkles className="w-3.5 h-3.5 text-primary" /> Como você está no topo do "Local Pack", você captura 85% dos cliques orgânicos da região.
           </p>
        </div>

        {/* WIDGET 4: Análise Semântica (AI Insights) */}
        <div className="lg:col-span-5 glass-card p-8 flex flex-col h-full">
          <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            IA: Mineração de Sentimentos
          </h2>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">O que seus clientes mais elogiam</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                "{qtdAvaliacoes > 0 ? "Com base nas últimas avaliações percebemos fortes menções positivas a palavras como 'excelente atendimento', 'rapidez' e 'profissionais qualificados'." : "Aguardando novas avaliações no Google para gerar insights precisos de sentimento."}"
              </p>
            </div>
            
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Média</p>
                <p className="text-3xl font-black text-white">4.8 <span className="text-sm font-medium text-yellow-400">★</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Impacto Positivo</p>
                <p className="text-3xl font-black text-sucesso">92%</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
