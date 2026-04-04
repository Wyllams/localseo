process.env.DATABASE_URL = "postgresql://postgres.sokskmuynndtjthuikgb:Jonny2020%40%21%40@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
import { bd } from "./src/db";
import { avaliacoes, negocios } from "./src/db/schema";
import { randomUUID } from "crypto";

async function seed() {
  const listaNegocios = await bd.query.negocios.findMany();
  const neg = listaNegocios[0];
  if(!neg) {
    console.log('Sem negocio');
    process.exit(1);
  }

  await bd.insert(avaliacoes).values([
    {
      id: randomUUID(),
      negocioId: neg.id,
      autor: 'João Silva',
      nota: 1,
      texto: 'Péssimo atendimento, o lugar estava sujo!',
      sentimento: 'NEGATIVO',
      respondido: false,
      publicadoEm: new Date(Date.now() - 86400000)
    },
    {
      id: randomUUID(),
      negocioId: neg.id,
      autor: 'Maria Souza',
      nota: 5,
      texto: 'Incrível! Volto todo final de semana.',
      sentimento: 'POSITIVO',
      respondido: false,
      publicadoEm: new Date(Date.now() - 172800000)
    }
  ]);
  console.log('Avaliacoes criadas com sucesso!');
  process.exit(0);
}
seed();
