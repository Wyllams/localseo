import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Enums ===== */
export const enumStatusArtigo = pgEnum("status_artigo", [
  "RASCUNHO",
  "PUBLICADO",
  "ARQUIVADO",
]);

/* ===== Tabela: Artigos ===== */
export const artigos = pgTable("artigos", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull(),
  conteudo: jsonb("conteudo"), // Array de seções: {heading, body, imageUrl, imageAlt}
  metaDescricao: varchar("meta_descricao", { length: 300 }),
  palavraChave: varchar("palavra_chave", { length: 255 }),
  palavrasChaveSecundarias: text("palavras_chave_secundarias").array(),
  imagemHero: varchar("imagem_hero", { length: 500 }),
  faqSchema: jsonb("faq_schema"), // Perguntas e respostas para FAQPage schema
  internalLinks: jsonb("internal_links"), // Links para outros artigos do mesmo negócio
  wordCount: integer("word_count"), // Contagem de palavras
  readingTime: integer("reading_time"), // Tempo de leitura em minutos
  status: enumStatusArtigo("status").notNull().default("RASCUNHO"),
  publicadoEm: timestamp("publicado_em", { withTimezone: true, mode: "date" }),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const artigosRelacoes = relations(artigos, ({ one }) => ({
  negocio: one(negocios, {
    fields: [artigos.negocioId],
    references: [negocios.id],
  }),
}));
