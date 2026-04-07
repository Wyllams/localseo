import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ===== Enums ===== */
export const enumPlano = pgEnum("plano", [
  "STARTER",
  "PRO",
  "PRO_PLUS",
]);

export const enumStatusPlano = pgEnum("status_plano", [
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
]);

export const enumCategoria = pgEnum("categoria_negocio", [
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
]);

/* ===== Tabela: Negócios ===== */
export const negocios = pgTable("negocios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  categoria: enumCategoria("categoria").notNull(),
  cidade: varchar("cidade", { length: 255 }).notNull(),
  estado: varchar("estado", { length: 2 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 20 }),
  website: varchar("website", { length: 500 }),
  descricao: text("descricao"),
  subdominio: varchar("subdominio", { length: 255 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 500 }),

  // === Google My Business ===
  gmbContaId: varchar("gmb_conta_id", { length: 255 }),
  gmbLocalId: varchar("gmb_local_id", { length: 255 }),
  gAccessToken: text("g_access_token"),       // Token criptografado
  gRefreshToken: text("g_refresh_token"),      // Token criptografado
  gTokenExpiry: timestamp("g_token_expiry", { withTimezone: true, mode: "date" }),

  // === Google Search Console ===
  scConectado: boolean("sc_conectado").notNull().default(false),
  scSiteUrl: varchar("sc_site_url", { length: 500 }),

  // === Plano e Assinatura ===
  donoId: varchar("dono_id", { length: 255 }).notNull(),
  plano: enumPlano("plano").notNull().default("STARTER"),
  statusPlano: enumStatusPlano("status_plano").notNull().default("TRIAL"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true, mode: "date" }),
  asaasClienteId: varchar("asaas_cliente_id", { length: 255 }),
  asaasAssinaturaId: varchar("asaas_assinatura_id", { length: 255 }),

  // === Configuração do Site IA ===
  siteAtivo: boolean("site_ativo").notNull().default(false),
  siteServicos: jsonb("site_servicos").$type<string[]>(),
  siteTomVoz: varchar("site_tom_voz", { length: 50 }),
  siteWhatsapp: varchar("site_whatsapp", { length: 20 }),
  siteCor: varchar("site_cor", { length: 7 }),
  siteImagemDestaque: varchar("site_imagem_destaque", { length: 500 }),

  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações: Negócios ===== */
export const negociosRelacoes = relations(negocios, ({ many }) => ({
  artigos: many(artigos),
  postagens: many(postagens),
  avaliacoes: many(avaliacoes),
  execucoesAgente: many(execucoesAgente),
  pontuacoesPresenca: many(pontuacoesPresenca),
  landingPages: many(landingPages),
  palavrasChave: many(palavrasChaveNegocio),
  historicoRanking: many(historicoRanking),
  verificacoesNap: many(verificacoesNap),
}));

/* ===== Import circular-safe: Declarações forward das tabelas ===== */
import { artigos } from "./artigo";
import { postagens } from "./postagem";
import { avaliacoes } from "./avaliacao";
import { execucoesAgente } from "./execucao-agente";
import { pontuacoesPresenca } from "./pontuacao-presenca";
import { landingPages } from "./landing-page";
import { palavrasChaveNegocio } from "./palavras-chave-negocio";
import { historicoRanking } from "./historico-ranking";
import { verificacoesNap } from "./verificacoes-nap";
