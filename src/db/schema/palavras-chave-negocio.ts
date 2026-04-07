import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Enums ===== */
export const enumTipoPalavraChave = pgEnum("tipo_palavra_chave", [
  "PRIMARY",
  "SECONDARY",
  "LONG_TAIL",
  "INFORMATIONAL",
  "TRANSACTIONAL",
]);

/* ===== Tabela: Palavras-chave do Negócio ===== */
export const palavrasChaveNegocio = pgTable("palavras_chave_negocio", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  palavraChave: varchar("palavra_chave", { length: 500 }).notNull(),
  volume: integer("volume"), // Volume de busca mensal (DataForSEO)
  dificuldade: integer("dificuldade"), // 0-100 dificuldade SEO
  tipo: enumTipoPalavraChave("tipo").notNull().default("PRIMARY"),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const palavrasChaveNegocioRelacoes = relations(
  palavrasChaveNegocio,
  ({ one }) => ({
    negocio: one(negocios, {
      fields: [palavrasChaveNegocio.negocioId],
      references: [negocios.id],
    }),
  })
);
