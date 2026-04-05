import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ===== Tabela: Landing Pages Isoladas ===== */
export const landingPages = pgTable("landing_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id").notNull(),
  servicoFoco: varchar("servico_foco", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  isPrincipal: boolean("is_principal").notNull().default(false),
  headline: varchar("headline", { length: 500 }),
  subtitulo: text("subtitulo"),
  servicos: jsonb("servicos").$type<string[]>(),
  diferencial: text("diferencial"),
  tomVoz: varchar("tom_voz", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  corPrimaria: varchar("cor_primaria", { length: 7 }),
  imagemDestaque: varchar("imagem_destaque", { length: 500 }),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações: Landing Pages ===== */
export const landingPagesRelacoes = relations(landingPages, ({ one }) => ({
  negocio: one(negocios, {
    fields: [landingPages.negocioId],
    references: [negocios.id],
  }),
}));

/* ===== Import circular-safe ===== */
import { negocios } from "./negocio";
