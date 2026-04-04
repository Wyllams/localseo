import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  console.log("Applying migrations manually...");
  await sql`ALTER TABLE "negocios" ADD COLUMN IF NOT EXISTS "asaas_assinatura_id" varchar(255);`;
  await sql`ALTER TABLE "negocios" ADD COLUMN IF NOT EXISTS "status_assinatura" varchar(50);`;
  console.log("Migration applied successfully!");
  await sql.end();
}

main().catch(console.error);
