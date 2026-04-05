"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { atualizarPerfilUsuario } from "./actions";
import { User, Mail, Phone, MapPin, Loader2 } from "lucide-react";

interface FormularioPerfilProps {
  user: {
    name: string;
    email: string;
    telefone?: string | null;
    endereco?: string | null;
  };
}

export function FormularioPerfil({ user }: FormularioPerfilProps) {
  const [estaCarregando, iniciarTransacao] = useTransition();

  const handleSubmit = (formData: FormData) => {
    iniciarTransacao(async () => {
      const res = await atualizarPerfilUsuario(formData);
      if (res.success) {
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error(res.error || "Erro ao atualizar perfil.");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome Completo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              name="name"
              defaultValue={user.name}
              required
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Telefone</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="tel"
              name="telefone"
              defaultValue={user.telefone || ""}
              placeholder="(00) 00000-0000"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Endereço Completo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              name="endereco"
              defaultValue={user.endereco || ""}
              placeholder="Rua, Número, Bairro, Cidade - UF"
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
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
