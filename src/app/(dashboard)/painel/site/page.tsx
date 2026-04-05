import { Globe, Rocket, Sparkles, LayoutTemplate } from "lucide-react";

export default function PaginaSite() {
  return (
    <div className="space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
        <LayoutTemplate className="w-12 h-12 text-primary" />
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
        O Seu Novo Site Local
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 mt-2 inline-block">
          Gerado 100% por IA
        </span>
      </h1>
      
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
        Estamos desenvolvendo um gerador de Landing Pages definitivo para negócios locais. 
        Em breve, com apenas 1 clique, a IA criará um site otimizado para SEO, integrado diretamente ao seu Google Meu Negócio e formatado para captar muito mais leads.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl">
        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-blue-500/50 transition-colors">
          <div className="p-3 bg-blue-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <Rocket className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-bold text-lg">Velocidade Extrema</h3>
          <p className="text-sm text-muted-foreground mt-2">Sites velozes e leves projetados especificamente para pontuar nota máxima no Google PageSpeed.</p>
        </div>
        
        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-amber-500/50 transition-colors relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-bold text-lg">Conteúdo Sincronizado</h3>
          <p className="text-sm text-muted-foreground mt-2">A plataforma alimentará o site automaticamente com suas avaliações, fotos e postagens do GMB.</p>
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-emerald-500/50 transition-colors">
          <div className="p-3 bg-emerald-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <Globe className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-bold text-lg">SEO & Domínio Próprio</h3>
          <p className="text-sm text-muted-foreground mt-2">Estrutura Schema.org local pré-configurada. Hospedagem inclusa com a possibilidade de usar seu próprio domínio .com.br.</p>
        </div>
      </div>

      <div className="mt-12 bg-primary/5 border border-primary/20 px-6 py-3 rounded-full flex items-center justify-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        <span className="font-semibold text-sm text-primary">Esta funcionalidade chegará na próxima grande atualização (V2.0).</span>
      </div>
    </div>
  );
}
