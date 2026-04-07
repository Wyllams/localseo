/**
 * Ponto central de exportação de todos os schemas do banco.
 * O Drizzle usa este arquivo como fonte da verdade.
 */

// Tabelas
export { negocios, enumPlano, enumStatusPlano, enumCategoria } from "./negocio";
export { artigos, enumStatusArtigo } from "./artigo";
export { postagens, enumTipoPostagem, enumStatusPostagem } from "./postagem";
export { avaliacoes, enumSentimento } from "./avaliacao";
export { execucoesAgente, enumTipoAgente, enumStatusExecucao } from "./execucao-agente";
export { pontuacoesPresenca } from "./pontuacao-presenca";
export { user, session, account, verification } from "./auth";
export { landingPages } from "./landing-page";
export { palavrasChaveNegocio, enumTipoPalavraChave } from "./palavras-chave-negocio";
export { historicoRanking } from "./historico-ranking";
export { verificacoesNap } from "./verificacoes-nap";

// Relações
export { negociosRelacoes } from "./negocio";
export { artigosRelacoes } from "./artigo";
export { postagensRelacoes } from "./postagem";
export { avaliacoesRelacoes } from "./avaliacao";
export { execucoesAgenteRelacoes } from "./execucao-agente";
export { pontuacoesPresencaRelacoes } from "./pontuacao-presenca";
export { landingPagesRelacoes } from "./landing-page";
export { palavrasChaveNegocioRelacoes } from "./palavras-chave-negocio";
export { historicoRankingRelacoes } from "./historico-ranking";
export { verificacoesNapRelacoes } from "./verificacoes-nap";
