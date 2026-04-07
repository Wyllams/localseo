/**
 * Agente de Perfil GMB — Verifica completude do perfil no Google Meu Negócio.
 *
 * Analisa quais campos estão preenchidos e gera:
 * - Score de completude (0-100%)
 * - Lista de itens faltantes
 * - Sugestão de descrição otimizada via IA
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

/* ===== Tipos ===== */

export interface CampoChecklist {
  campo: string;
  label: string;
  preenchido: boolean;
  valor?: string;
  peso: number; // Peso percentual no score
}

export interface ResultadoPerfilGmb {
  score: number; // 0-100
  campos: CampoChecklist[];
  descricaoSugerida?: string;
  recomendacoes: string[];
}

interface DadosNegocio {
  nome: string;
  categoria: string;
  cidade: string;
  estado?: string;
  endereco?: string;
  telefone?: string;
  website?: string;
  descricao?: string;
  logoUrl?: string;
  gmbConectado: boolean;
}

/* ===== Checklist de campos ===== */

function avaliarCampos(dados: DadosNegocio): CampoChecklist[] {
  return [
    {
      campo: "nome",
      label: "Nome do Negócio",
      preenchido: !!dados.nome && dados.nome.length > 2,
      valor: dados.nome,
      peso: 15,
    },
    {
      campo: "categoria",
      label: "Categoria",
      preenchido: !!dados.categoria,
      valor: dados.categoria,
      peso: 10,
    },
    {
      campo: "endereco",
      label: "Endereço Completo",
      preenchido: !!dados.endereco && dados.endereco.length > 10,
      valor: dados.endereco,
      peso: 15,
    },
    {
      campo: "telefone",
      label: "Telefone / WhatsApp",
      preenchido: !!dados.telefone && dados.telefone.length >= 10,
      valor: dados.telefone,
      peso: 10,
    },
    {
      campo: "website",
      label: "Website",
      preenchido: !!dados.website && dados.website.startsWith("http"),
      valor: dados.website,
      peso: 10,
    },
    {
      campo: "descricao",
      label: "Descrição do Negócio",
      preenchido: !!dados.descricao && dados.descricao.length > 30,
      valor: dados.descricao,
      peso: 15,
    },
    {
      campo: "logo",
      label: "Logo / Foto do Perfil",
      preenchido: !!dados.logoUrl,
      valor: dados.logoUrl,
      peso: 10,
    },
    {
      campo: "gmb",
      label: "Google Meu Negócio Conectado",
      preenchido: dados.gmbConectado,
      peso: 15,
    },
  ];
}

/* ===== Calcular Score ===== */

function calcularScore(campos: CampoChecklist[]): number {
  let pontos = 0;
  for (const campo of campos) {
    if (campo.preenchido) {
      pontos += campo.peso;
    }
  }
  return Math.min(pontos, 100);
}

/* ===== Gerar recomendações ===== */

function gerarRecomendacoes(campos: CampoChecklist[]): string[] {
  const faltantes = campos.filter((c) => !c.preenchido);
  const recomendacoes: string[] = [];

  for (const campo of faltantes) {
    switch (campo.campo) {
      case "endereco":
        recomendacoes.push(
          "📍 Adicione seu endereço completo com número. O Google prioriza negócios com localização exata."
        );
        break;
      case "telefone":
        recomendacoes.push(
          "📞 Adicione um telefone. Clientes que encontram seu número pelo Google convertem 50% mais."
        );
        break;
      case "website":
        recomendacoes.push(
          "🌐 Conecte seu website. Ative o construtor de Landing Pages para criar um site profissional."
        );
        break;
      case "descricao":
        recomendacoes.push(
          "📝 A descrição do negócio é essencial para SEO. Use o gerador IA abaixo para criar uma descrição otimizada."
        );
        break;
      case "logo":
        recomendacoes.push(
          "🖼️ Adicione uma logo. Perfis com foto são 70% mais clicados no Google Maps."
        );
        break;
      case "gmb":
        recomendacoes.push(
          "🔗 Conecte seu Google Meu Negócio para desbloquear reviews, posts e rank tracking."
        );
        break;
      default:
        recomendacoes.push(`⚠️ Complete o campo: ${campo.label}`);
    }
  }

  return recomendacoes;
}

/* ===== Gerar descrição otimizada via IA ===== */

async function gerarDescricaoIA(dados: DadosNegocio): Promise<string | undefined> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
    return `${dados.nome} é referência em ${dados.categoria} em ${dados.cidade}. Com atendimento personalizado e qualidade comprovada, oferecemos a melhor experiência para nossos clientes. Visite-nos e descubra por que somos a escolha favorita da região.`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            descricao: {
              type: SchemaType.STRING,
              description: "Descrição otimizada para SEO local do Google Meu Negócio (máx 750 caracteres)",
            },
          },
          required: ["descricao"],
        },
      },
    });

    const prompt = `Crie uma descrição otimizada para SEO local de um negócio no Google Meu Negócio.
Negócio: ${dados.nome}
Categoria: ${dados.categoria}
Cidade: ${dados.cidade}${dados.estado ? ` - ${dados.estado}` : ""}

Regras:
1. Máximo 750 caracteres
2. Inclua o nome do negócio, categoria e cidade naturalmente
3. Mencione diferenciais (atendimento, qualidade, experiência)
4. Finalize com um convite para visitar
5. Tom acolhedor e profissional
6. NÃO use emojis
7. Escreva em português brasileiro`;

    const resultado = await model.generateContent(prompt);
    const json = JSON.parse(resultado.response.text());
    return json.descricao;
  } catch (error) {
    console.error("[Agente Perfil GMB] Erro ao gerar descrição:", error);
    return undefined;
  }
}

/* ===== Função principal ===== */

/**
 * Analisa a completude do perfil GMB de um negócio.
 */
export async function analisarPerfilGmb(
  dados: DadosNegocio
): Promise<ResultadoPerfilGmb> {
  const campos = avaliarCampos(dados);
  const score = calcularScore(campos);
  const recomendacoes = gerarRecomendacoes(campos);

  // Gerar descrição sugerida se não tem uma boa
  let descricaoSugerida: string | undefined;
  if (!dados.descricao || dados.descricao.length < 30) {
    descricaoSugerida = await gerarDescricaoIA(dados);
  }

  return {
    score,
    campos,
    descricaoSugerida,
    recomendacoes,
  };
}
