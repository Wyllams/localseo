import {
  Megaphone,
  CalendarDays,
  Image as ImageIcon,
  Box,
  Trash2,
  Tag,
  Gift,
  FileText,
  Eye,
  Clock,
  AlertCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, postagens } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { CriadorPostagem } from "./criador-postagem";
import { ListaPostagens } from "./lista-postagens";
import { cn } from "@/lib/utils";

export default async function PaginaPostagens() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) redirect("/login");

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioUser) redirect("/onboarding");

  // Buscar postagens
  const listaPostagens = await bd.query.postagens.findMany({
    where: eq(postagens.negocioId, negocioUser.id),
    orderBy: [desc(postagens.criadoEm)],
  });

  // Métricas
  const total = listaPostagens.length;
  const publicadas = listaPostagens.filter((p) => p.status === "PUBLICADO").length;
  const rascunhos = listaPostagens.filter((p) => p.status === "RASCUNHO").length;
  const agendadas = listaPostagens.filter((p) => p.status === "AGENDADO").length;
  const comImagem = listaPostagens.filter((p) => p.imagemUrl).length;

  // Posts por tipo
  const porTipo = {
    NOVIDADE: listaPostagens.filter((p) => p.tipo === "NOVIDADE").length,
    OFERTA: listaPostagens.filter((p) => p.tipo === "OFERTA").length,
    EVENTO: listaPostagens.filter((p) => p.tipo === "EVENTO").length,
  };

  // Este mês
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const esteMes = listaPostagens.filter(
    (p) => new Date(p.criadoEm) >= inicioMes
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Postagens GMB
        </h1>
        <p className="text-muted-foreground mt-1">
          Crie e gerencie posts otimizados para o Google Meu Negócio com
          Inteligência Artificial.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Publicados
            </span>
            <Megaphone className="w-4 h-4 text-sucesso" />
          </div>
          <p className="text-3xl font-bold text-sucesso">{publicadas}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {esteMes} este mês
          </p>
        </div>

        <div className="glass-card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rascunhos
            </span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold">{rascunhos}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            aguardando revisão
          </p>
        </div>

        <div className="glass-card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Com Imagem
            </span>
            <ImageIcon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">{comImagem}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {total > 0
              ? `${Math.round((comImagem / total) * 100)}% do total`
              : "nenhum post"}
          </p>
        </div>

        <div className="glass-card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Por Tipo
            </span>
            <Tag className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs">
              <Megaphone className="w-3 h-3 text-primary" />
              <span className="font-bold">{porTipo.NOVIDADE}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Gift className="w-3 h-3 text-sucesso" />
              <span className="font-bold">{porTipo.OFERTA}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <CalendarDays className="w-3 h-3 text-amber-500" />
              <span className="font-bold">{porTipo.EVENTO}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Criador + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna: Criador */}
        <div className="lg:col-span-1">
          <CriadorPostagem />
        </div>

        {/* Coluna: Lista de posts */}
        <div className="lg:col-span-2">
          <ListaPostagens postagens={listaPostagens} />
        </div>
      </div>
    </div>
  );
}
