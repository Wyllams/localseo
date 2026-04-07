/**
 * Cálculo de Score de Presença Local — v2.
 *
 * Score total: 0–100 pontos, dividido em 4 dimensões de 25 pontos cada:
 *
 * 1. GMB (25 pts) — Perfil completo + posts regulares
 * 2. Avaliações (25 pts) — Nota média + taxa de resposta
 * 3. Site/Landing Page (25 pts) — Online + Schema + CWV
 * 4. Blog/Conteúdo (25 pts) — Artigos + frequência + qualidade
 */

export interface DadosParaScore {
  // GMB
  gmbConectado: boolean;
  gmbPerfilCompleto: number; // 0-100 percentual
  totalPostsSemana: number;
  totalPostsMes: number;

  // Avaliações
  notaMedia: number; // 1-5
  totalAvaliacoes: number;
  taxaResposta: number; // 0-1

  // Site
  siteAtivo: boolean;
  temSchema: boolean;
  totalLandingPages: number;

  // Blog
  totalArtigos: number;
  artigosUltimos30Dias: number;
  mediaWordCount: number;
}

export interface ResultadoScore {
  total: number;       // 0-100
  gmb: number;         // 0-25
  avaliacoes: number;  // 0-25
  site: number;        // 0-25
  blog: number;        // 0-25
  detalheTexto: string;
}

/**
 * Calcula o score completo de presença local.
 */
export function calcularScorePresenca(dados: DadosParaScore): ResultadoScore {
  let gmb = 0;
  let avaliacoes = 0;
  let site = 0;
  let blog = 0;

  // ========= GMB (25 pts) =========
  if (dados.gmbConectado) {
    gmb += 5; // Conectado = 5 pts
    gmb += Math.min((dados.gmbPerfilCompleto / 100) * 10, 10); // Completude = até 10 pts
    gmb += Math.min(dados.totalPostsSemana * 2.5, 10); // Posts semanais = até 10 pts (4 posts = 10)
  }

  // ========= Avaliações (25 pts) =========
  if (dados.totalAvaliacoes > 0) {
    // Nota média: 5 → 15 pts, 4 → 12 pts, 3 → 8 pts
    avaliacoes += Math.min((dados.notaMedia / 5) * 15, 15);

    // Taxa de resposta: 100% → 5 pts
    avaliacoes += dados.taxaResposta * 5;

    // Volume de reviews: 10+ → 5 pts, 5+ → 3 pts, 1+ → 1 pt
    if (dados.totalAvaliacoes >= 10) avaliacoes += 5;
    else if (dados.totalAvaliacoes >= 5) avaliacoes += 3;
    else avaliacoes += 1;
  }

  // ========= Site (25 pts) =========
  if (dados.siteAtivo) {
    site += 10; // Site ativo = 10 pts
    if (dados.temSchema) site += 5; // Schema markup = 5 pts
    site += Math.min(dados.totalLandingPages * 2, 10); // Landing pages = até 10 pts (5 páginas = 10)
  }

  // ========= Blog (25 pts) =========
  if (dados.totalArtigos > 0) {
    // Volume total
    if (dados.totalArtigos >= 15) blog += 10;
    else if (dados.totalArtigos >= 8) blog += 7;
    else if (dados.totalArtigos >= 3) blog += 5;
    else blog += 2;

    // Frequência recente (últimos 30 dias)
    if (dados.artigosUltimos30Dias >= 4) blog += 10;
    else if (dados.artigosUltimos30Dias >= 2) blog += 7;
    else if (dados.artigosUltimos30Dias >= 1) blog += 4;

    // Qualidade (wordCount médio)
    if (dados.mediaWordCount >= 1500) blog += 5;
    else if (dados.mediaWordCount >= 800) blog += 3;
    else if (dados.mediaWordCount >= 400) blog += 1;
  }

  // Garantir que nenhum pilar excede 25
  gmb = Math.min(gmb, 25);
  avaliacoes = Math.min(avaliacoes, 25);
  site = Math.min(site, 25);
  blog = Math.min(blog, 25);

  const total = Math.round(gmb + avaliacoes + site + blog);

  // Texto descritivo
  let detalheTexto: string;
  if (total >= 80) detalheTexto = "Excelente! Seu negócio está dominando o SEO local.";
  else if (total >= 60) detalheTexto = "Muito bom. Algumas otimizações podem levar você ao topo.";
  else if (total >= 40) detalheTexto = "Progresso sólido. Continue aprimorando seu perfil e conteúdo.";
  else if (total >= 20) detalheTexto = "Início promissor. Foque em completar seu perfil e gerar conteúdo.";
  else detalheTexto = "Vamos começar! Conecte seu Google Meu Negócio e ative seu site.";

  return {
    total,
    gmb: Math.round(gmb),
    avaliacoes: Math.round(avaliacoes),
    site: Math.round(site),
    blog: Math.round(blog),
    detalheTexto,
  };
}
