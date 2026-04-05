"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { alterarSenhaUsuario } from "./actions";
import { KeyRound, Loader2, Lock } from "lucide-react";

export function FormularioSenha() {
  const [estaCarregando, iniciarTransacao] = useTransition();

  const handleSubmit = (formData: FormData) => {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    iniciarTransacao(async () => {
      const res = await alterarSenhaUsuario(formData);
      if (res.success) {
        toast.success("Senha alterada com sucesso!");
        // Limpar os campos do form manualmente seria o ideal aqui,
        // mas o component será remontado ou o user recarrega.
      } else {
        toast.error(res.error || "Erro ao alterar a senha.");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Senha Atual */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Senha Atual</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              name="currentPassword"
              required
              placeholder="Sua senha atual"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Nova Senha */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nova Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              name="newPassword"
              required
              placeholder="Pelo menos 8 caracteres"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Confirmar Nova Senha */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Repita a nova senha"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={estaCarregando}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {estaCarregando && <Loader2 className="w-4 h-4 animate-spin" />}
          Alterar Senha
        </button>
      </div>
    </form>
  );
}
