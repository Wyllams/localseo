/**
 * Tipos globais do projeto RikoSEO v2.
 * Centraliza todas as interfaces e types compartilhados.
 */

/* ===== Negócio ===== */
export type CategoriaNegocio =
  | "RESTAURANTE"
  | "CLINICA"
  | "BARBEARIA"
  | "ACADEMIA"
  | "FARMACIA"
  | "SALAO_DE_BELEZA"
  | "PET_SHOP"
  | "LOJA"
  | "SERVICOS"
  | "EDUCACAO"
  | "BELEZA_ESTETICA"
  | "OUTRO";

export type PlanoAssinatura = "STARTER" | "PRO" | "PRO_PLUS";
export type StatusPlano = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface Negocio {
  id: string;
  nome: string;
  slug: string;
  categoria: CategoriaNegocio;
  cidade: string;
  estado?: string;
  endereco?: string;
  telefone?: string;
  website?: string;
  descricao?: string;
  subdominio: string;
  logoUrl?: string;
  // Google My Business
  gmbContaId?: string;
  gmbLocalId?: string;
  gAccessToken?: string;
  gRefreshToken?: string;
  gTokenExpiry?: Date;
  // Google Search Console
  scConectado: boolean;
  scSiteUrl?: string;
  // Plano
  plano: PlanoAssinatura;
  statusPlano: StatusPlano;
  trialEndsAt?: Date;
  donoId: string;
  // Site
  siteAtivo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/* ===== Avaliação (Review) ===== */
export type Sentimento = "POSITIVO" | "NEGATIVO" | "NEUTRO";

export interface Avaliacao {
  id: string;
  negocioId: string;
  googleReviewId?: string;
  autor: string;
  nota: number;
  texto?: string;
  sentimento?: Sentimento;
  respondido: boolean;
  textoResposta?: string;
  respondidoEm?: Date;
  alertaEnviado: boolean;
  publicadoEm: Date;
  criadoEm: Date;
}

/* ===== Postagem GMB ===== */
export type TipoPostagem = "NOVIDADE" | "OFERTA" | "EVENTO";
export type StatusPostagem = "RASCUNHO" | "PUBLICADO" | "AGENDADO" | "FALHOU";

export interface Postagem {
  id: string;
  negocioId: string;
  conteudo: string;
  imagemUrl?: string;
  imagemAlt?: string;
  palavraChave?: string;
  tipo: TipoPostagem;
  status: StatusPostagem;
  gmbPostId?: string;
  agendadoPara?: Date;
  publicadoEm?: Date;
  criadoEm: Date;
}

/* ===== Artigo ===== */
export type StatusArtigo = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

export interface SecaoArtigo {
  subtitulo: string;
  conteudo: string;
  imagemUrl?: string;
  imagemAlt?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InternalLink {
  text: string;
  targetArticleSlug: string;
  targetArticleTitle: string;
}

export interface ConteudoArtigo {
  introducao: string;
  secoes: SecaoArtigo[];
  conclusao: string;
}

export interface Artigo {
  id: string;
  negocioId: string;
  titulo: string;
  slug: string;
  conteudo?: ConteudoArtigo;
  metaDescricao?: string;
  palavraChave?: string;
  palavrasChaveSecundarias?: string[];
  imagemHero?: string;
  faqSchema?: FaqItem[];
  internalLinks?: InternalLink[];
  wordCount?: number;
  readingTime?: number;
  status: StatusArtigo;
  publicadoEm?: Date;
  criadoEm: Date;
}

/* ===== Palavras-chave ===== */
export type TipoPalavraChave = "PRIMARY" | "SECONDARY" | "LONG_TAIL" | "INFORMATIONAL" | "TRANSACTIONAL";

export interface PalavraChaveNegocio {
  id: string;
  negocioId: string;
  palavraChave: string;
  volume?: number;
  dificuldade?: number;
  tipo: TipoPalavraChave;
  criadoEm: Date;
}

/* ===== Rank Tracking ===== */
export interface HistoricoRanking {
  id: string;
  negocioId: string;
  palavraChave: string;
  posicao?: number;
  posicaoMaps?: number;
  fonte: string;
  verificadoEm: Date;
}

/* ===== NAP Check ===== */
export interface VerificacaoNap {
  id: string;
  negocioId: string;
  fonte: string;
  nome?: string;
  endereco?: string;
  telefone?: string;
  consistente: boolean;
  problemas?: string[];
  verificadoEm: Date;
}

/* ===== Execução do Agente ===== */
export type TipoAgente = "GMB" | "AVALIACOES" | "BLOG" | "SITE" | "GMB_PERFIL" | "RANK_TRACKER" | "RELATORIO" | "NAP_CHECK";
export type StatusExecucao = "PENDENTE" | "EXECUTANDO" | "SUCESSO" | "FALHOU";

export interface ExecucaoAgente {
  id: string;
  negocioId: string;
  tipo: TipoAgente;
  status: StatusExecucao;
  resultado?: Record<string, unknown>;
  tokensUsados?: number;
  duracaoMs?: number;
  erro?: Record<string, unknown>;
  criadoEm: Date;
}

/* ===== Pontuação de Presença ===== */
export interface PontuacaoPresenca {
  id: string;
  negocioId: string;
  total: number;        // 0-100
  pontuacaoGmb: number; // 0-25
  pontuacaoAvaliacoes: number; // 0-25
  pontuacaoSite: number;      // 0-25
  pontuacaoBlog: number;      // 0-25
  criadoEm: Date;
}

/* ===== Planos do Produto ===== */
export interface InfoPlano {
  id: PlanoAssinatura;
  nome: string;
  preco: number;
  descricao: string;
  funcionalidades: string[];
  destaque?: boolean;
}

export const PLANOS: InfoPlano[] = [
  {
    id: "STARTER",
    nome: "Starter",
    preco: 97,
    descricao: "GMB automatizado: posts semanais + reviews respondidos",
    funcionalidades: [
      "Resposta automática de avaliações",
      "1 post semanal no Google Meu Negócio",
      "Score de presença local básico",
      "Alerta de reviews negativos por email",
    ],
  },
  {
    id: "PRO",
    nome: "Pro",
    preco: 197,
    descricao: "Tudo do Starter + site profissional + blog SEO",
    destaque: true,
    funcionalidades: [
      "Tudo do plano Starter",
      "Site/Subdomínio profissional otimizado",
      "Blog com artigos SEO locais (4/mês)",
      "Schema Markup completo (JSON-LD)",
      "Sitemap automático",
    ],
  },
  {
    id: "PRO_PLUS",
    nome: "Pro+",
    preco: 297,
    descricao: "Visibilidade máxima com Search Console + Rank Tracking",
    funcionalidades: [
      "Tudo do plano Pro",
      "Google Search Console integrado",
      "Rank Tracking (posição no Google)",
      "Relatório semanal avançado por email",
      "Artigos SEO ilimitados",
      "Suporte prioritário",
    ],
  },
];

/* ===== Categorias com labels ===== */
export const CATEGORIAS: { valor: CategoriaNegocio; rotulo: string }[] = [
  { valor: "RESTAURANTE", rotulo: "Restaurante" },
  { valor: "CLINICA", rotulo: "Clínica / Consultório" },
  { valor: "BARBEARIA", rotulo: "Barbearia" },
  { valor: "ACADEMIA", rotulo: "Academia" },
  { valor: "FARMACIA", rotulo: "Farmácia" },
  { valor: "SALAO_DE_BELEZA", rotulo: "Salão de Beleza" },
  { valor: "PET_SHOP", rotulo: "Pet Shop" },
  { valor: "LOJA", rotulo: "Loja / Comércio" },
  { valor: "SERVICOS", rotulo: "Serviços (encanador, eletricista...)" },
  { valor: "EDUCACAO", rotulo: "Educação" },
  { valor: "BELEZA_ESTETICA", rotulo: "Beleza / Estética" },
  { valor: "OUTRO", rotulo: "Outro" },
];
