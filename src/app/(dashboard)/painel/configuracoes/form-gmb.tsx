"use client";

import { useState, useEffect } from "react";
import {
  carregarDadosGMB,
  carregarLocaisGMB,
  salvarConfiguracaoGMB,
  testarConexaoGMB,
} from "./actions";
import {
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PenLine,
  Plug,
  MapPin,
  Phone,
  Globe,
  Star,
  Tag,
  Zap,
} from "lucide-react";

interface DadosLocal {
  nome: string;
  endereco: string;
  telefone: string;
  categoria: string;
  website: string;
  status: string;
  totalReviews: number;
  notaMedia: number;
}

export function FormularioGmb() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [contas, setContas] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);

  const [contaSelecionada, setContaSelecionada] = useState("");
  const [localSelecionado, setLocalSelecionado] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Modo manual: quando o usuário prefere digitar IDs diretamente
  const [modoManual, setModoManual] = useState(false);
  const [contaManual, setContaManual] = useState("");
  const [localManual, setLocalManual] = useState("");

  // Dados reais da localização após teste
  const [dadosLocal, setDadosLocal] = useState<DadosLocal | null>(null);

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
            setContaManual(res.contaAtual);
            carregarLojas(res.contaAtual);
          }
          if (res.localAtual) {
            setLocalSelecionado(res.localAtual);
            setLocalManual(res.localAtual);
          }
        }
      } catch {
        setErro(
          "Erro inesperado ao conectar com o Google. Tente fazer logout e login novamente."
        );
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
    } catch {
      setErro("Erro ao carregar locais desta conta.");
    }
  }

  function onMudarConta(e: React.ChangeEvent<HTMLSelectElement>) {
    const cc = e.target.value;
    setContaSelecionada(cc);
    setLocalSelecionado("");
    setLocais([]);
    setErro("");
    setDadosLocal(null);
    if (cc) carregarLojas(cc);
  }

  function onMudarLocal(e: React.ChangeEvent<HTMLSelectElement>) {
    setLocalSelecionado(e.target.value);
    setDadosLocal(null); // Reset dados ao mudar local
  }

  async function testarConexao() {
    setTestando(true);
    setErro("");
    setDadosLocal(null);

    const local = modoManual ? localManual.trim() : localSelecionado;
    if (!local) {
      setErro("Selecione ou informe um local antes de testar.");
      setTestando(false);
      return;
    }

    try {
      const res = await testarConexaoGMB(local);
      if (res.sucesso && res.dados) {
        setDadosLocal(res.dados);
      } else {
        setErro(res.erro || "Teste falhou sem detalhes.");
      }
    } catch {
      setErro("Erro inesperado ao testar conexão.");
    }
    setTestando(false);
  }

  async function salvar() {
    setSalvando(true);
    setMensagemSucesso("");
    setErro("");

    const conta = modoManual ? contaManual.trim() : contaSelecionada;
    const local = modoManual ? localManual.trim() : localSelecionado;

    if (!conta || !local) {
      setErro("Preencha a Conta e o Local antes de salvar.");
      setSalvando(false);
      return;
    }

    try {
      const res = await salvarConfiguracaoGMB(conta, local);
      if (res.sucesso) {
        setMensagemSucesso(
          "Google Meu Negócio conectado com sucesso! Posts, Reviews e Analytics agora estão habilitados. 🎉"
        );
      } else {
        setErro(res.erro || "Erro ao salvar.");
      }
    } catch {
      setErro("Erro inesperado ao salvar. Tente novamente.");
    }
    setSalvando(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Verificando conexão com Google Meu Negócio...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <p className="text-sm text-muted-foreground">
        Selecione abaixo a Conta e a Ficha da loja oficial do Google para
        permitir que a IA publique posts, responda reviews e acompanhe métricas.
      </p>

      {/* Mensagem de erro */}
      {erro && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-destructive">Erro na conexão</p>
            <p className="text-destructive/80 mt-1 break-words">{erro}</p>
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

      {/* ===== MODO AUTOMÁTICO (dropdown) ===== */}
      {!modoManual && (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Conta Google (Account)
            </label>
            <select
              value={contaSelecionada}
              onChange={onMudarConta}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {contas.length === 0
                  ? "Nenhuma conta GMB encontrada"
                  : "Selecione sua conta..."}
              </option>
              {contas.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.accountName}
                </option>
              ))}
            </select>
          </div>

          {locais.length > 0 && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Local / Loja (Location)
              </label>
              <select
                value={localSelecionado}
                onChange={onMudarLocal}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione o local/loja...</option>
                {locais.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.title}
                    {l.endereco ? ` — ${l.endereco}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* ===== MODO MANUAL (input text) ===== */}
      {modoManual && (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              ID da Conta (Account)
            </label>
            <input
              type="text"
              value={contaManual}
              onChange={(e) => setContaManual(e.target.value)}
              placeholder="accounts/123456789"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-[11px] text-muted-foreground">
              Formato:{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                accounts/123456789
              </code>{" "}
              — Encontre em business.google.com na URL do seu perfil.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">
              ID do Local (Location)
            </label>
            <input
              type="text"
              value={localManual}
              onChange={(e) => setLocalManual(e.target.value)}
              placeholder="accounts/123456789/locations/987654321"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-[11px] text-muted-foreground">
              Formato:{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                accounts/123456789/locations/987654321
              </code>
            </p>
          </div>
        </>
      )}

      {/* ===== Card de dados reais da localização ===== */}
      {dadosLocal && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h4 className="font-bold text-emerald-500">
              Conexão verificada ✓
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{dadosLocal.nome}</p>
                <p className="text-muted-foreground text-xs">
                  {dadosLocal.endereco}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {dadosLocal.categoria}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {dadosLocal.telefone}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {dadosLocal.website}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-muted-foreground">
                {dadosLocal.notaMedia > 0
                  ? `${dadosLocal.notaMedia}★ (${dadosLocal.totalReviews} reviews)`
                  : "Sem avaliações ainda"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Status:{" "}
                <span
                  className={
                    dadosLocal.status === "OPEN"
                      ? "text-emerald-500 font-medium"
                      : "text-amber-500 font-medium"
                  }
                >
                  {dadosLocal.status === "OPEN"
                    ? "Aberto"
                    : dadosLocal.status === "CLOSED_PERMANENTLY"
                      ? "Fechado"
                      : dadosLocal.status}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {/* Botão Testar Conexão */}
        <button
          onClick={testarConexao}
          disabled={
            testando ||
            (modoManual ? !localManual.trim() : !localSelecionado)
          }
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto transition-colors"
        >
          {testando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Plug className="w-4 h-4" />
              Testar Conexão
            </>
          )}
        </button>

        {/* Botão Conectar */}
        <button
          onClick={salvar}
          disabled={
            salvando ||
            (modoManual
              ? !contaManual.trim() || !localManual.trim()
              : !localSelecionado)
          }
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto transition-colors"
        >
          {salvando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              Conectar API Oficial
            </>
          )}
        </button>

        {/* Toggle entre modos */}
        <button
          onClick={() => {
            setModoManual(!modoManual);
            setDadosLocal(null);
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-full sm:w-auto transition-colors"
        >
          <PenLine className="w-4 h-4" />
          {modoManual ? "Modo Automático" : "Modo Manual"}
        </button>
      </div>
    </div>
  );
}
