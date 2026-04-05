import { bd } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await bd.execute(sql`ALTER TABLE "negocios" ADD COLUMN "site_imagem_destaque" varchar(500);`);
    console.log("Migration applied via Drizzle!");
  } catch (e) {
    if (e.message.includes("already exists")) {
       console.log("Column already exists.");
    } else {
       console.error("Migration failed:", e);
    }
  }
  process.exit(0);
}

main();
