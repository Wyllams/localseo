"use client";

import { useState } from "react";
import { X, Loader2, Copy, Check, QrCode } from "lucide-react";
import { processarPixAction } from "./actions";
import { toast } from "sonner";

interface PixData {
  qrCodeBase64: string;
  pixCopiaECola: string;
  expiracao: string;
  cobrancaId: string;
}

export function ModalPix({
  isOpen,
  onClose,
  planoCorrente,
}: {
  isOpen: boolean;
  onClose: () => void;
  planoCorrente: { id: string; nome: string; preco: number } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Form
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");

  if (!isOpen || !planoCorrente) return null;

  async function handleGerarPix(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await processarPixAction(
        planoCorrente!.id as any,
        planoCorrente!.preco,
        {
          nome,
          cpfCnpj: cpfCnpj.replace(/\D/g, ""),
        }
      );

      if (res.sucesso && res.qrCodeBase64) {
        setPixData({
          qrCodeBase64: res.qrCodeBase64,
          pixCopiaECola: res.pixCopiaECola!,
          expiracao: res.expiracao!,
          cobrancaId: res.cobrancaId!,
        });
        toast.success("QR Code PIX gerado com sucesso!");
      } else {
        toast.error(res.erro || "Falha ao gerar PIX.");
      }
    } catch {
      toast.error("Erro inesperado ao gerar PIX.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopiar() {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola);
      setCopiado(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      toast.error("Falha ao copiar. Selecione manualmente.");
    }
  }

  function handleVoltar() {
    setPixData(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pagar via PIX</h2>
              <p className="text-sm text-muted-foreground">
                {planoCorrente.nome} — R$ {planoCorrente.preco}/mês
              </p>
            </div>
          </div>
          <button onClick={handleVoltar} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!pixData ? (
            /* === ETAPA 1: Dados para gerar PIX === */
            <form onSubmit={handleGerarPix} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Informe seus dados para gerar o QR Code PIX.
              </p>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Nome Completo
                </label>
                <input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none"
                  placeholder="João da Silva"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  CPF / CNPJ
                </label>
                <input
                  required
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none"
                  placeholder="000.000.000-00"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" /> Gerar QR Code PIX
                  </>
                )}
              </button>
            </form>
          ) : (
            /* === ETAPA 2: QR Code gerado === */
            <div className="space-y-6 text-center">
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code abaixo ou copie o código para pagar
              </p>

              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-56 h-56"
                  />
                </div>
              </div>

              {/* Copia e cola */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PIX Copia e Cola
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={pixData.pixCopiaECola}
                    className="w-full bg-background border rounded-lg px-4 py-3 text-xs font-mono resize-none h-20 focus:ring-2 focus:ring-teal-500/50 outline-none"
                  />
                  <button
                    onClick={handleCopiar}
                    className="absolute top-2 right-2 bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg transition-colors"
                    title="Copiar código PIX"
                  >
                    {copiado ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Aviso */}
              <div className="glass-card p-4 text-left bg-teal-500/5 border-teal-500/20">
                <p className="text-xs text-muted-foreground">
                  ⏳ Após o pagamento ser confirmado pelo banco, seu plano será
                  atualizado automaticamente. Isso pode levar alguns minutos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {pixData && (
          <div className="p-6 border-t bg-muted/10 flex justify-center">
            <button
              onClick={handleCopiar}
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Código PIX
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
