CREATE TYPE "public"."status_plano" AS ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."tipo_palavra_chave" AS ENUM('PRIMARY', 'SECONDARY', 'LONG_TAIL', 'INFORMATIONAL', 'TRANSACTIONAL');--> statement-breakpoint
ALTER TYPE "public"."categoria_negocio" ADD VALUE 'EDUCACAO' BEFORE 'OUTRO';--> statement-breakpoint
ALTER TYPE "public"."categoria_negocio" ADD VALUE 'BELEZA_ESTETICA' BEFORE 'OUTRO';--> statement-breakpoint
ALTER TYPE "public"."tipo_agente" ADD VALUE 'GMB_PERFIL';--> statement-breakpoint
ALTER TYPE "public"."tipo_agente" ADD VALUE 'RANK_TRACKER';--> statement-breakpoint
ALTER TYPE "public"."tipo_agente" ADD VALUE 'RELATORIO';--> statement-breakpoint
ALTER TYPE "public"."tipo_agente" ADD VALUE 'NAP_CHECK';--> statement-breakpoint
CREATE TABLE "historico_ranking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"palavra_chave" varchar(500) NOT NULL,
	"posicao" integer,
	"posicao_maps" integer,
	"fonte" varchar(50) NOT NULL,
	"verificado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palavras_chave_negocio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"palavra_chave" varchar(500) NOT NULL,
	"volume" integer,
	"dificuldade" integer,
	"tipo" "tipo_palavra_chave" DEFAULT 'PRIMARY' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificacoes_nap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"fonte" varchar(100) NOT NULL,
	"nome" varchar(500),
	"endereco" text,
	"telefone" varchar(50),
	"consistente" boolean DEFAULT true NOT NULL,
	"problemas" text[],
	"verificado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negocios" ALTER COLUMN "plano" SET DATA TYPE text;--> statement-breakpoint
UPDATE "negocios" SET "plano" = 'STARTER' WHERE "plano" = 'INICIAL';--> statement-breakpoint
ALTER TABLE "negocios" ALTER COLUMN "plano" SET DEFAULT 'STARTER'::text;--> statement-breakpoint
DROP TYPE "public"."plano";--> statement-breakpoint
CREATE TYPE "public"."plano" AS ENUM('STARTER', 'PRO', 'PRO_PLUS');--> statement-breakpoint
ALTER TABLE "negocios" ALTER COLUMN "plano" SET DEFAULT 'STARTER'::"public"."plano";--> statement-breakpoint
ALTER TABLE "negocios" ALTER COLUMN "plano" SET DATA TYPE "public"."plano" USING "plano"::"public"."plano";--> statement-breakpoint
ALTER TABLE "artigos" ADD COLUMN "faq_schema" jsonb;--> statement-breakpoint
ALTER TABLE "artigos" ADD COLUMN "internal_links" jsonb;--> statement-breakpoint
ALTER TABLE "artigos" ADD COLUMN "word_count" integer;--> statement-breakpoint
ALTER TABLE "artigos" ADD COLUMN "reading_time" integer;--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD COLUMN "alerta_enviado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "endereco" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "g_access_token" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "g_refresh_token" text;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "g_token_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "sc_conectado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "sc_site_url" varchar(500);--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "status_plano" "status_plano" DEFAULT 'TRIAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "negocios" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "postagens" ADD COLUMN "imagem_alt" varchar(500);--> statement-breakpoint
ALTER TABLE "postagens" ADD COLUMN "palavra_chave" varchar(255);--> statement-breakpoint
ALTER TABLE "postagens" ADD COLUMN "gmb_post_id" varchar(500);--> statement-breakpoint
ALTER TABLE "historico_ranking" ADD CONSTRAINT "historico_ranking_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palavras_chave_negocio" ADD CONSTRAINT "palavras_chave_negocio_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificacoes_nap" ADD CONSTRAINT "verificacoes_nap_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negocios" DROP COLUMN "status_assinatura";--> statement-breakpoint
ALTER TABLE "negocios" DROP COLUMN "site_headline";--> statement-breakpoint
ALTER TABLE "negocios" DROP COLUMN "site_subtitulo";--> statement-breakpoint
ALTER TABLE "negocios" DROP COLUMN "site_diferencial";