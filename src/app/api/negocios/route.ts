import { NextRequest, NextResponse } from "next/server";
import { bd } from "@/db";
import { negocios, palavrasChaveNegocio } from "@/db/schema";
import { gerarSlug } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

/**
 * Schema de validação para criação de negócio.
 */
const schemaCriarNegocio = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255, "Nome muito longo"),
  categoria: z.enum([
    "RESTAURANTE",
    "CLINICA",
    "BARBEARIA",
    "ACADEMIA",
    "FARMACIA",
    "SALAO_DE_BELEZA",
    "PET_SHOP",
    "LOJA",
    "SERVICOS",
    "EDUCACAO",
    "BELEZA_ESTETICA",
    "OUTRO",
  ]),
  cidade: z
    .string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(255),
  estado: z.string().max(2).optional().default(""),
  telefone: z.string().max(20).optional().default(""),
  website: z.string().max(500).optional().default(""),
  descricao: z.string().max(1000).optional().default(""),
  plano: z.enum(["STARTER", "PRO", "PRO_PLUS"]).default("STARTER"),
  palavrasChave: z.array(z.string().min(2).max(200)).max(10).optional().default([]),
});

/**
 * POST /api/negocios — Cria um novo negócio para o usuário logado.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const sessao = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessao?.user?.id) {
      return NextResponse.json(
        { mensagem: "Não autorizado. Faça login primeiro." },
        { status: 401 }
      );
    }

    // 2. Validar dados de entrada
    const corpo = await request.json();
    const resultado = schemaCriarNegocio.safeParse(corpo);

    if (!resultado.success) {
      return NextResponse.json(
        {
          mensagem: "Dados inválidos",
          erros: resultado.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const dados = resultado.data;

    // 3. Gerar slug e subdomínio únicos
    const slug = gerarSlug(dados.nome);
    const subdominio = slug;

    // 4. Calcular trial de 7 dias
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);

    // 5. Criar o negócio no banco
    const [novoNegocio] = await bd
      .insert(negocios)
      .values({
        nome: dados.nome,
        slug,
        subdominio,
        categoria: dados.categoria,
        cidade: dados.cidade,
        estado: dados.estado || null,
        telefone: dados.telefone || null,
        website: dados.website || null,
        descricao: dados.descricao || null,
        plano: dados.plano,
        donoId: sessao.user.id,
        statusPlano: "TRIAL",
        trialEndsAt: trialEnds,
      })
      .returning();

    // 6. Salvar palavras-chave do onboarding
    if (dados.palavrasChave.length > 0) {
      await bd.insert(palavrasChaveNegocio).values(
        dados.palavrasChave.map((kw) => ({
          negocioId: novoNegocio.id,
          palavraChave: kw,
          tipo: "PRIMARY" as const,
        }))
      );
    }

    return NextResponse.json(
      {
        mensagem: "Negócio criado com sucesso!",
        negocio: novoNegocio,
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error("[API] Erro ao criar negócio:", erro);

    // Tratar erro de slug duplicado
    if (
      erro instanceof Error &&
      erro.message.includes("unique")
    ) {
      return NextResponse.json(
        { mensagem: "Já existe um negócio com esse nome. Tente outro." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { mensagem: "Erro interno ao criar negócio." },
      { status: 500 }
    );
  }
}
