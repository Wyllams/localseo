"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios, landingPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { gerarConteudoSite } from "@/lib/ai/gerar-site";
import { gerarSlug } from "@/lib/utils";

/**
 * Salva a configuração do site e gera conteúdo com IA.
 * Chamada quando o cliente preenche o formulário de setup e clica "Gerar Site".
 */
export async function salvarConfiguracaoSite(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return { erro: "Não autenticado." };

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) return { erro: "Negócio não encontrado." };

  const servicosRaw = formData.get("servicos") as string;
  const servicos = servicosRaw
    ? servicosRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const servicoFoco = formData.get("servicoFoco") as string;
  if (!servicoFoco) {
    return { erro: "O Serviço Principal é obrigatório." };
  }

  const nomeNegocio = (formData.get("nomeNegocio") as string) || negocioUser.nome;
  const nicho = (formData.get("nicho") as string) || negocioUser.categoria;
  const tomVoz = (formData.get("tomVoz") as string) || "profissional";
  const diferencial = (formData.get("diferencial") as string) || "";
  const whatsapp = (formData.get("whatsapp") as string) || "";
  let imagemDestaque = formData.get("imagemDestaque") as string;

  // Gerar conteúdo textual com IA focado no Serviço
  const conteudo = await gerarConteudoSite({
    nomeNegocio,
    nicho,
    servicoFoco,
    servicos,
    diferencial,
    tomVoz: tomVoz as "profissional" | "descontraido" | "agressivo",
    cidade: negocioUser.cidade,
    estado: negocioUser.estado,
  });

  // Se não enviou imagem, a IA busca uma baseada no nicho
  if (!imagemDestaque || imagemDestaque.trim() === "") {
    const { buscarImagemUnsplash } = await import("@/lib/unsplash");
    imagemDestaque = await buscarImagemUnsplash(conteudo.termoImagem || "business");
  }

  const totalLps = await bd.query.landingPages.findMany({
    where: eq(landingPages.negocioId, negocioUser.id),
  });

  const isPrincipal = totalLps.length === 0;

  // Cria um slug seguro para o serviço foco
  const baseSlug = gerarSlug(servicoFoco);
  let finalSlug = baseSlug;
  // Previne slugs duplicados no mesmo negócio
  let count = 1;
  while (totalLps.some(lp => lp.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${count}`;
    count++;
  }

  // Inserir registro na tabela landing_pages
  await bd.insert(landingPages).values({
    negocioId: negocioUser.id,
    servicoFoco,
    slug: finalSlug,
    isPrincipal,
    headline: conteudo.headline,
    subtitulo: conteudo.subtitulo,
    servicos,
    diferencial,
    tomVoz,
    whatsapp,
    imagemDestaque,
    ativo: true,
  });

  revalidatePath("/painel/site");
  revalidatePath(`/site/${negocioUser.subdominio}`);

  return { sucesso: true };
}

export async function excluirLandingPage(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) return;

  const lpId = formData.get("lpId") as string;
  if (!lpId) return;

  await bd.delete(landingPages).where(and(
    eq(landingPages.id, lpId),
    eq(landingPages.negocioId, negocioUser.id) // Ensure only owner deletes
  ));

  revalidatePath("/painel/site");
}

export async function toggleLandingPage(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) return;

  const lpId = formData.get("lpId") as string;
  const novoStatus = formData.get("ativo") === "true";

  if (!lpId) return;

  await bd
    .update(landingPages)
    .set({
      ativo: novoStatus,
      atualizadoEm: new Date(),
    })
    .where(and(
      eq(landingPages.id, lpId),
      eq(landingPages.negocioId, negocioUser.id)
    ));

  revalidatePath("/painel/site");
}
