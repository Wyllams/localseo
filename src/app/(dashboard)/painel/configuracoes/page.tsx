import { Settings, Lock, UserCog, KeyRound } from "lucide-react";
import { FormularioGmb } from "./form-gmb";
import { FormularioPerfil } from "./form-perfil";
import { FormularioSenha } from "./form-senha";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function PaginaConfiguracoes() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  
  if (!sessao?.user?.id) {
    redirect("/login");
  }

  // Busca os dados do usuário usando Drizzle para pegar os campos customizados
  const dadosUsuario = await bd.query.user.findFirst({
    where: eq(userTable.id, sessao.user.id),
  });

  if (!dadosUsuario) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu perfil, conexão com Google e assinatura.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meu Perfil */}
        <div className="glass-card p-8 flex flex-col items-start border border-border">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <UserCog className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Atualize suas informações pessoais de contato.
          </p>
          <div className="w-full">
            <FormularioPerfil user={dadosUsuario} />
          </div>
        </div>

        {/* Segurança e Senha */}
        <div className="glass-card p-8 flex flex-col items-start border border-border">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Segurança</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Altere sua senha de acesso ao painel.
          </p>
          <div className="w-full">
            <FormularioSenha />
          </div>
        </div>

        {/* Conexão GMB */}
        <div className="glass-card p-8 flex flex-col items-start border border-emerald-500/20">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.64 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Conexão Google Meu Negócio</h2>
          
          <div className="w-full mt-4">
            <FormularioGmb />
          </div>
        </div>

        {/* Assinatura Asaas */}
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center opacity-50 relative pointer-events-none">
          <div className="absolute top-4 right-4"><Lock className="w-4 h-4" /></div>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Assinatura Asaas</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Gerenciamento de faturas e planos será liberado na Fase 8.
          </p>
        </div>
      </div>
    </div>
  );
}
