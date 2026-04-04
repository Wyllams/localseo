import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as esquema from "./schema";

/**
 * Conexão com o banco PostgreSQL via Supabase.
 * Usa Transaction Pooler (prepare: false) para compatibilidade serverless.
 */
const stringConexaoRaw = process.env.DATABASE_URL;

if (!stringConexaoRaw) {
  throw new Error(
    "❌ DATABASE_URL não configurada. Verifique o arquivo .env.local"
  );
}

// Remove aspas simples ou duplas caso o usuário tenha copiado errado para o painel do Vercel
const stringConexao = stringConexaoRaw.replace(/^["']|["']$/g, "");

const cliente = postgres(stringConexao, {
  prepare: false, // Necessário para Supabase Transaction Pooler
  max: 10,        // Máximo de conexões simultâneas
});

export const bd = drizzle(cliente, { schema: esquema });

export type BancoDeDados = typeof bd;
