"use client";

import { useState, Suspense } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Modo = "login" | "cadastro";

/**
 * Componente interno que alterna entre Login e Cadastro na mesma página.
 */
function LoginForm() {
  const [modo, setModo] = useState<Modo>("login");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const router = useRouter();
  const parametros = useSearchParams();
  const redirecionarPara = parametros.get("redirecionar") || "/painel";

  /** Alterna para o modo cadastro */
  function irParaCadastro() {
    setErro(null);
    setSucesso(null);
    setModo("cadastro");
  }

  /** Volta para o modo login */
  function irParaLogin() {
    setErro(null);
    setSucesso(null);
    setModo("login");
  }

  /** Login com Google OAuth */
  async function entrarComGoogle() {
    try {
      setCarregando(true);
      setErro(null);

      const res = await signIn.social({
        provider: "google",
        callbackURL: redirecionarPara,
      });

      if (res.error) {
        throw new Error(res.error.message || "Erro desconhecido ao conectar com o Google");
      }
    } catch (err: any) {
      setErro(`Erro: ${err.message}`);
      setCarregando(false);
    }
  }

  /** Login por email/senha */
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("senha") as string;

    if (!email || !password) return setErro("Preencha todos os campos.");

    try {
      setCarregando(true);
      setErro(null);

      const resLogin = await signIn.email({ email, password });

      if (resLogin.error) {
        throw new Error("Email ou senha inválidos.");
      }

      window.location.href = redirecionarPara;
    } catch (err: any) {
      setErro(err.message || "Credenciais inválidas");
      setCarregando(false);
    }
  }

  /** Cadastro de nova conta */
  async function handleCadastro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = (formData.get("nome") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const telefone = (formData.get("telefone") as string)?.trim();
    const senha = formData.get("senha") as string;

    if (!nome || !email || !telefone || !senha) {
      return setErro("Preencha todos os campos.");
    }

    if (senha.length < 8) {
      return setErro("A senha deve ter pelo menos 8 caracteres.");
    }

    try {
      setCarregando(true);
      setErro(null);

      const { signUp } = await import("@/lib/auth-client");
      const res = await signUp.email({
        email,
        password: senha,
        name: nome,
      });

      if (res.error) throw new Error(res.error.message || "Erro ao criar conta");

      // Sucesso — volta para login
      setSucesso("Conta criada com sucesso! Faça login para continuar.");
      setModo("login");
      setCarregando(false);
    } catch (err: any) {
      setErro(err.message || "Erro ao criar conta");
      setCarregando(false);
    }
  }

  // ───────────── MODO CADASTRO ─────────────
  if (modo === "cadastro") {
    return (
      <div key="cadastro" className="animate-fade-in">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <img src="/favicon.png" alt="RikoSEO" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-bold">RikoSEO</span>
        </div>

        {/* Botão voltar */}
        <button
          onClick={irParaLogin}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </button>

        {/* Cabeçalho */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Criar sua conta
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados abaixo para começar
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-6 p-4 rounded-lg bg-perigo/10 border border-perigo/20 text-perigo text-sm">
            {erro}
          </div>
        )}

        {/* Formulário de cadastro */}
        <form onSubmit={handleCadastro} className="space-y-4 text-left">
          <div>
            <label htmlFor="cad-nome" className="block text-sm font-medium text-muted-foreground mb-1">
              Nome completo
            </label>
            <input
              id="cad-nome"
              name="nome"
              type="text"
              required
              autoComplete="name"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
                focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none"
            />
          </div>

          <div>
            <label htmlFor="cad-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="cad-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
                focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none"
            />
          </div>

          <div>
            <label htmlFor="cad-telefone" className="block text-sm font-medium text-muted-foreground mb-1">
              Telefone
            </label>
            <input
              id="cad-telefone"
              name="telefone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
                focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none
                placeholder:text-muted-foreground/40"
            />
          </div>

          <div>
            <label htmlFor="cad-senha" className="block text-sm font-medium text-muted-foreground mb-1">
              Senha
            </label>
            <input
              id="cad-senha"
              name="senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
                focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none"
            />
            <p className="text-xs text-muted-foreground/60 mt-1">Mínimo 8 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 mt-2 rounded-xl gradient-primary text-white font-medium 
              hover:shadow-lg hover:shadow-primary/25 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        {/* Link para login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <button
              onClick={irParaLogin}
              className="text-primary font-medium hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ───────────── MODO LOGIN (padrão) ─────────────
  return (
    <div key="login" className="animate-fade-in">
      {/* Logo mobile */}
      <div className="lg:hidden mb-8 flex items-center gap-3">
        <img src="/favicon.png" alt="RikoSEO" className="w-10 h-10 rounded-xl" />
        <span className="text-xl font-bold">RikoSEO</span>
      </div>

      {/* Cabeçalho */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-muted-foreground">
          Entre com sua conta para continuar
        </p>
      </div>

      {/* Mensagem de sucesso (após cadastro) */}
      {sucesso && (
        <div className="mb-6 p-4 rounded-lg bg-sucesso/10 border border-sucesso/20 text-sucesso text-sm">
          {sucesso}
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="mb-6 p-4 rounded-lg bg-perigo/10 border border-perigo/20 text-perigo text-sm">
          {erro}
        </div>
      )}

      {/* Botão Google OAuth */}
      <button
        onClick={entrarComGoogle}
        disabled={carregando}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl 
          bg-white text-gray-800 font-medium text-base
          hover:bg-gray-50 active:bg-gray-100
          border border-gray-200
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
          group"
      >
        {carregando ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{carregando ? "Conectando..." : "Continuar com Google"}</span>
      </button>

      {/* Separador */}
      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          ou
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Formulário de login */}
      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
              focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none"
          />
        </div>
        <div>
          <label htmlFor="senha" className="block text-sm font-medium text-muted-foreground mb-1">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground 
              focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 mt-2 rounded-xl gradient-primary text-white font-medium 
            hover:shadow-lg hover:shadow-primary/25 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? "Autenticando..." : "Login"}
        </button>
      </form>

      {/* Separador antes do cadastro */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Ainda não tem uma conta?
        </p>
        <button
          onClick={irParaCadastro}
          disabled={carregando}
          className="w-full py-3 rounded-xl border-2 border-primary text-primary font-medium 
            hover:bg-primary hover:text-primary-foreground
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}

/**
 * Página de Login / Cadastro — RikoSEO
 * Design premium com alternância entre login e cadastro na mesma tela.
 */
export default function PaginaLogin() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Suspense fallback={<div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
