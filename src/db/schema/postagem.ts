import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Enums ===== */
export const enumTipoPostagem = pgEnum("tipo_postagem", [
  "NOVIDADE",
  "OFERTA",
  "EVENTO",
]);

export const enumStatusPostagem = pgEnum("status_postagem", [
  "RASCUNHO",
  "PUBLICADO",
  "AGENDADO",
  "FALHOU",
]);

/* ===== Tabela: Postagens GMB ===== */
export const postagens = pgTable("postagens", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  conteudo: text("conteudo").notNull(),
  imagemUrl: varchar("imagem_url", { length: 500 }),
  imagemAlt: varchar("imagem_alt", { length: 500 }),
  palavraChave: varchar("palavra_chave", { length: 255 }), // Palavra-chave usada no post
  tipo: enumTipoPostagem("tipo").notNull().default("NOVIDADE"),
  status: enumStatusPostagem("status").notNull().default("RASCUNHO"),
  gmbPostId: varchar("gmb_post_id", { length: 500 }), // ID retornado pela GMB API
  agendadoPara: timestamp("agendado_para", { withTimezone: true, mode: "date" }),
  publicadoEm: timestamp("publicado_em", { withTimezone: true, mode: "date" }),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const postagensRelacoes = relations(postagens, ({ one }) => ({
  negocio: one(negocios, {
    fields: [postagens.negocioId],
    references: [negocios.id],
  }),
}));
