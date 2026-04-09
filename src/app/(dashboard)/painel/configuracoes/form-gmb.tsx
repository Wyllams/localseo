"use client";

import { useState, useEffect } from "react";
import { carregarDadosGMB, carregarLocaisGMB, salvarConfiguracaoGMB } from "./actions";
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function FormularioGmb() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [contas, setContas] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);

  const [contaSelecionada, setContaSelecionada] = useState("");
  const [localSelecionado, setLocalSelecionado] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const res = await carregarDadosGMB();
        if (res.erro) {
          setErro(res.erro);
        } else {
          setContas(res.accounts || []);
          if (res.contaAtual) {
            setContaSelecionada(res.contaAtual);
            carregarLojas(res.contaAtual);
          }
          if (res.localAtual) {
            setLocalSelecionado(res.localAtual);
          }
        }
      } catch (e: any) {
        setErro("Erro inesperado ao conectar com o Google. Tente fazer logout e login novamente.");
        console.error("[FormGMB] Init error:", e);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function carregarLojas(accountName: string) {
    try {
      const res = await carregarLocaisGMB(accountName);
      if (!res.erro && res.locais) {
        setLocais(res.locais);
      } else if (res.erro) {
        setErro(res.erro);
      }
    } catch (e: any) {
      setErro("Erro ao carregar locais desta conta.");
    }
  }

  function onMudarConta(e: any) {
    const cc = e.target.value;
    setContaSelecionada(cc);
    setLocalSelecionado("");
    setLocais([]);
    setErro("");
    if (cc) carregarLojas(cc);
  }

  async function salvar() {
    setSalvando(true);
    setMensagemSucesso("");
    setErro("");
    try {
      const res = await salvarConfiguracaoGMB(contaSelecionada, localSelecionado);
      if (res.sucesso) {
        setMensagemSucesso(
          "Google Meu Negócio conectado com sucesso! Posts e Reviews agora estão habilitados. 🎉"
        );
      } else {
        setErro(res.erro || "Erro ao salvar.");
      }
    } catch (e: any) {
      setErro("Erro inesperado ao salvar. Tente novamente.");
    }
    setSalvando(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Verificando conexão com Google Meu Negócio...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <p className="text-sm text-muted-foreground">
        Selecione abaixo a Conta e a Ficha da loja oficial do Google para permitir que a IA publique posts e responda reviews.
      </p>

      {/* Mensagem de erro */}
      {erro && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Erro na conexão</p>
            <p className="text-destructive/80 mt-1">{erro}</p>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {mensagemSucesso && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-500">Conectado!</p>
            <p className="text-emerald-600/80 mt-1">{mensagemSucesso}</p>
          </div>
        </div>
      )}

      {/* Seletor de Conta */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Conta Google (Account)</label>
        <select
          value={contaSelecionada}
          onChange={onMudarConta}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {contas.length === 0 ? "Nenhuma conta GMB encontrada" : "Selecione sua conta..."}
          </option>
          {contas.map((c) => (
            <option key={c.name} value={c.name}>
              {c.accountName}
            </option>
          ))}
        </select>
        {contas.length === 0 && !erro && (
          <p className="text-xs text-amber-500">
            Sua conta Google não possui perfis no Google Meu Negócio. Crie um perfil em{" "}
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              business.google.com
            </a>
          </p>
        )}
      </div>

      {/* Seletor de Local */}
      {locais.length > 0 && (
        <div className="grid gap-2">
          <label className="text-sm font-medium">Local / Loja (Location)</label>
          <select
            value={localSelecionado}
            onChange={(e) => setLocalSelecionado(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecione o local/loja...</option>
            {locais.map((l) => (
              <option key={l.name} value={l.name}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={salvar}
          disabled={!localSelecionado || salvando}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto transition-colors"
        >
          {salvando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              Conectar API Oficial
            </>
          )}
        </button>

        <button
          onClick={async () => {
            setSalvando(true);
            setErro("");
            try {
              const res = await salvarConfiguracaoGMB(
                "accounts/sandbox-conta-123",
                "accounts/sandbox-conta-123/locations/sandbox-loja-456"
              );
              if (res.sucesso) setMensagemSucesso("Modo Sandbox GMB Ativado com Sucesso! 🧪");
              else setErro(res.erro || "Erro");
            } catch {
              setErro("Erro ao ativar sandbox.");
            }
            setSalvando(false);
          }}
          disabled={salvando}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto transition-colors"
        >
          {salvando ? "Ativando..." : "Bypass Sandbox"}
        </button>
      </div>
    </div>
  );
}
