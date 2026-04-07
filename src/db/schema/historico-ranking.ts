import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Tabela: Histórico de Ranking ===== */
export const historicoRanking = pgTable("historico_ranking", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  palavraChave: varchar("palavra_chave", { length: 500 }).notNull(),
  posicao: integer("posicao"), // Posição orgânica (null = não ranqueia)
  posicaoMaps: integer("posicao_maps"), // Posição no Google Maps
  fonte: varchar("fonte", { length: 50 }).notNull(), // GOOGLE_ORGANIC, GOOGLE_MAPS
  verificadoEm: timestamp("verificado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const historicoRankingRelacoes = relations(
  historicoRanking,
  ({ one }) => ({
    negocio: one(negocios, {
      fields: [historicoRanking.negocioId],
      references: [negocios.id],
    }),
  })
);
