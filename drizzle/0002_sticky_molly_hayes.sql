ALTER TABLE "negocios" ADD COLUMN "site_ativo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_headline" varchar(500);--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_subtitulo" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_servicos" jsonb;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_diferencial" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_tom_voz" varchar(50);--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_whatsapp" varchar(20);--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_cor" varchar(7);--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "site_imagem_destaque" varchar(500);