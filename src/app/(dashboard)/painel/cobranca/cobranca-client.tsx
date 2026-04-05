"use client";

import { useState } from "react";
import { CreditCard, Check, Sparkles, QrCode } from "lucide-react";
import { PLANOS } from "@/types";
import { cn } from "@/lib/utils";
import { ModalCheckout } from "./modal-checkout";
import { ModalPix } from "./modal-pix";

export default function CobrancaClient({
  planoAtual,
  statusAssinatura,
}: {
  planoAtual: string;
  statusAssinatura: string | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [planoAAssinar, setPlanoAAssinar] = useState<{
    id: string;
    nome: string;
    preco: number;
  } | null>(null);

  function handleAssinarCartao(planoId: string, nome: string, preco: number) {
    setPlanoAAssinar({ id: planoId, nome, preco });
    setModalOpen(true);
  }

  function handleAssinarPix(planoId: string, nome: string, preco: number) {
    setPlanoAAssinar({ id: planoId, nome, preco });
    setPixModalOpen(true);
  }

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano & Cobrança</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano de assinatura e pagamentos
        </p>
      </div>

      {/* Grid de planos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANOS.map((plano) => (
          <div
            key={plano.id}
            className={cn(
              "glass-card p-6 flex flex-col card-hover relative",
              plano.destaque && "ring-2 ring-primary",
              plano.id === planoAtual && "border-sucesso/50"
            )}
          >
            {plano.destaque && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white gradient-primary px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </span>
              </div>
            )}

            {plano.id === planoAtual && (
              <div className="absolute top-3 right-3">
                <span className="text-xs font-semibold text-sucesso bg-sucesso/10 border border-sucesso/20 px-3 py-1 rounded-full">
                  Atual
                </span>
              </div>
            )}

            <h3 className="text-lg font-bold">{plano.nome}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {plano.descricao}
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold">R$ {plano.preco}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plano.funcionalidades.map((func, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-sucesso flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{func}</span>
                </li>
              ))}
            </ul>

            {plano.id === planoAtual ? (
              <button
                disabled
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed"
              >
                Plano atual
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleAssinarCartao(plano.id, plano.nome, plano.preco as number)
                  }
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                    plano.destaque
                      ? "gradient-primary text-white hover:shadow-lg hover:shadow-primary/25"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Cartão
                </button>
                <button
                  onClick={() =>
                    handleAssinarPix(plano.id, plano.nome, plano.preco as number)
                  }
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1.5 border border-teal-500/20"
                >
                  <QrCode className="w-3.5 h-3.5" /> PIX
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Informação de pagamento */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Método de Pagamento</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Integração de pagamentos segurada pelo <strong>Asaas</strong>. Seus
          dados são transacionados diretamente no gateway com criptografia.
        </p>
      </div>

      <ModalCheckout
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        planoCorrente={planoAAssinar}
      />

      <ModalPix
        isOpen={pixModalOpen}
        onClose={() => setPixModalOpen(false)}
        planoCorrente={planoAAssinar}
      />
    </div>
  );
}
