"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { artigos, negocios, execucoesAgente } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { gerarArtigoBlogIA, calcularMetricasArtigo } from "@/lib/agents/agente-blog";
import { buscarImagemUnsplash } from "@/lib/unsplash";
import { gerarSlug } from "@/lib/utils";

export async function criarNovoArtigoIA(temaPrincipal: string) {
  try {
    const inicioExecucao = Date.now();

    const sessao = await auth.api.getSession({
      headers: await headers(),
    });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // Buscar artigos existentes para internal linking
    const artigosExistentes = await bd.query.artigos.findMany({
      where: eq(artigos.negocioId, negocioDb.id),
      columns: { titulo: true, slug: true },
      orderBy: [desc(artigos.criadoEm)],
      limit: 10,
    });

    // 1. Gerar artigo via IA com contexto de internal linking
    const resultadoIA = await gerarArtigoBlogIA({
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
      temaSugestao: temaPrincipal,
      cidade: negocioDb.cidade,
      artigosExistentes,
    });

    // 2. Buscar imagem Hero no Unsplash
    const urlImagem = await buscarImagemUnsplash(resultadoIA.termo_busca_imagem);

    // 3. Calcular métricas do artigo
    const metricas = calcularMetricasArtigo(resultadoIA.blocosDeConteudo);

    // 4. Gerar internal links baseados em artigos existentes
    const internalLinks = artigosExistentes.slice(0, 3).map((a) => ({
      titulo: a.titulo,
      slug: a.slug,
    }));

    // 5. Salvar auditoria
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "BLOG",
      status: "SUCESSO",
      resultado: {
        tituloGerado: resultadoIA.titulo,
        imagemFinal: urlImagem,
        palavraChave: resultadoIA.palavraChave,
        wordCount: metricas.wordCount,
      },
      duracaoMs: Date.now() - inicioExecucao,
    });

    // 6. Gerar slug único
    const slugDesejado = gerarSlug(resultadoIA.titulo);
    let finalSlug = slugDesejado;
    let counter = 1;
    while (artigosExistentes.some((a) => a.slug === finalSlug)) {
      finalSlug = `${slugDesejado}-${counter}`;
      counter++;
    }

    // 7. Salvar artigo
    await bd.insert(artigos).values({
      negocioId: negocioDb.id,
      titulo: resultadoIA.titulo,
      slug: finalSlug,
      metaDescricao: resultadoIA.metaDescricao,
      palavraChave: resultadoIA.palavraChave,
      palavrasChaveSecundarias: resultadoIA.palavrasChaveSecundarias,
      conteudo: resultadoIA.blocosDeConteudo,
      imagemHero: urlImagem,
      faqSchema: resultadoIA.faq,
      internalLinks,
      wordCount: metricas.wordCount,
      readingTime: metricas.readingTime,
      status: "PUBLICADO",
      publicadoEm: new Date(),
    });

    revalidatePath("/painel/blog");

    return { sucesso: true, slug: finalSlug };
  } catch (erro) {
    console.error("Action error criarNovoArtigoIA:", erro);
    return { sucesso: false, erro: "Ocorreu um erro interno na IA ao gerar o Artigo." };
  }
}

export async function excluirArtigo(formDados: FormData) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) return;

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });
  if (!negocioDb) return;

  const id = formDados.get("id") as string;
  if (!id) return;

  await bd.delete(artigos).where(
    and(eq(artigos.id, id), eq(artigos.negocioId, negocioDb.id))
  );

  revalidatePath("/painel/blog");
}
