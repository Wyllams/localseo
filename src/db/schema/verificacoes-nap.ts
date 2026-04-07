import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Tabela: Verificações de NAP (Nome, Endereço, Telefone) ===== */
export const verificacoesNap = pgTable("verificacoes_nap", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  fonte: varchar("fonte", { length: 100 }).notNull(), // GMB, WEBSITE, SUBDOMINIO, YELP, etc.
  nome: varchar("nome", { length: 500 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 50 }),
  consistente: boolean("consistente").notNull().default(true),
  problemas: text("problemas").array(), // Lista de inconsistências encontradas
  verificadoEm: timestamp("verificado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const verificacoesNapRelacoes = relations(
  verificacoesNap,
  ({ one }) => ({
    negocio: one(negocios, {
      fields: [verificacoesNap.negocioId],
      references: [negocios.id],
    }),
  })
);
