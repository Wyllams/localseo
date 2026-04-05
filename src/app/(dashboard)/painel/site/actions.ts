"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { gerarConteudoSite } from "@/lib/ai/gerar-site";

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

  // Extrair dados do formulário
  const servicosRaw = formData.get("servicos") as string;
  const servicos = servicosRaw
    ? servicosRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const nomeNegocio = (formData.get("nomeNegocio") as string) || negocioUser.nome;
  const nicho = (formData.get("nicho") as string) || negocioUser.categoria;
  const tomVoz = (formData.get("tomVoz") as string) || "profissional";
  const diferencial = (formData.get("diferencial") as string) || "";
  const whatsapp = (formData.get("whatsapp") as string) || "";

  // Gerar conteúdo com IA
  const conteudo = await gerarConteudoSite({
    nomeNegocio,
    nicho,
    servicos,
    diferencial,
    tomVoz: tomVoz as "profissional" | "descontraido" | "agressivo",
    cidade: negocioUser.cidade,
    estado: negocioUser.estado,
  });

  // Salvar tudo no banco
  await bd
    .update(negocios)
    .set({
      siteAtivo: true,
      siteHeadline: conteudo.headline,
      siteSubtitulo: conteudo.subtitulo,
      siteServicos: servicos,
      siteDiferencial: diferencial,
      siteTomVoz: tomVoz,
      siteWhatsapp: whatsapp,
      atualizadoEm: new Date(),
    })
    .where(eq(negocios.id, negocioUser.id));

  revalidatePath("/painel/site");
  revalidatePath(`/site/${negocioUser.subdominio}`);

  return { sucesso: true };
}

/**
 * Ativa ou desativa o site público sem apagar os dados cadastrados.
 */
export async function toggleSite(formData: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) return;

  const novoStatus = formData.get("ativo") === "true";

  await bd
    .update(negocios)
    .set({
      siteAtivo: novoStatus,
      atualizadoEm: new Date(),
    })
    .where(eq(negocios.id, negocioUser.id));

  revalidatePath("/painel/site");
  revalidatePath(`/site/${negocioUser.subdominio}`);
}
