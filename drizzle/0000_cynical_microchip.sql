CREATE TYPE "public"."categoria_negocio" AS ENUM('RESTAURANTE', 'CLINICA', 'BARBEARIA', 'ACADEMIA', 'FARMACIA', 'SALAO_DE_BELEZA', 'PET_SHOP', 'LOJA', 'SERVICOS', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."plano" AS ENUM('INICIAL', 'PRO', 'PRO_PLUS', 'AGENCIA');--> statement-breakpoint
CREATE TYPE "public"."sentimento" AS ENUM('POSITIVO', 'NEGATIVO', 'NEUTRO');--> statement-breakpoint
CREATE TYPE "public"."status_artigo" AS ENUM('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');--> statement-breakpoint
CREATE TYPE "public"."status_execucao" AS ENUM('PENDENTE', 'EXECUTANDO', 'SUCESSO', 'FALHOU');--> statement-breakpoint
CREATE TYPE "public"."status_postagem" AS ENUM('RASCUNHO', 'PUBLICADO', 'AGENDADO', 'FALHOU');--> statement-breakpoint
CREATE TYPE "public"."tipo_agente" AS ENUM('GMB', 'AVALIACOES', 'BLOG', 'SITE');--> statement-breakpoint
CREATE TYPE "public"."tipo_postagem" AS ENUM('NOVIDADE', 'OFERTA', 'EVENTO');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artigos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"titulo" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"conteudo" jsonb,
	"meta_descricao" varchar(300),
	"palavra_chave" varchar(255),
	"palavras_chave_secundarias" text[],
	"imagem_hero" varchar(500),
	"status" "status_artigo" DEFAULT 'RASCUNHO' NOT NULL,
	"publicado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avaliacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"google_review_id" varchar(500),
	"autor" varchar(255) NOT NULL,
	"nota" integer NOT NULL,
	"texto" text,
	"sentimento" "sentimento",
	"respondido" boolean DEFAULT false NOT NULL,
	"texto_resposta" text,
	"respondido_em" timestamp with time zone,
	"publicado_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avaliacoes_google_review_id_unique" UNIQUE("google_review_id")
);
--> statement-breakpoint
CREATE TABLE "execucoes_agente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"tipo" "tipo_agente" NOT NULL,
	"status" "status_execucao" DEFAULT 'PENDENTE' NOT NULL,
	"resultado" jsonb,
	"tokens_usados" integer,
	"duracao_ms" integer,
	"erro" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negocios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"categoria" "categoria_negocio" NOT NULL,
	"cidade" varchar(255) NOT NULL,
	"estado" varchar(2),
	"telefone" varchar(20),
	"website" varchar(500),
	"subdominio" varchar(255) NOT NULL,
	"gmb_conta_id" varchar(255),
	"gmb_local_id" varchar(255),
	"dono_id" varchar(255) NOT NULL,
	"plano" "plano" DEFAULT 'INICIAL' NOT NULL,
	"asaas_cliente_id" varchar(255),
	"logo_url" varchar(500),
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "negocios_slug_unique" UNIQUE("slug"),
	CONSTRAINT "negocios_subdominio_unique" UNIQUE("subdominio")
);
--> statement-breakpoint
CREATE TABLE "pontuacoes_presenca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"pontuacao_gmb" integer DEFAULT 0 NOT NULL,
	"pontuacao_avaliacoes" integer DEFAULT 0 NOT NULL,
	"pontuacao_site" integer DEFAULT 0 NOT NULL,
	"pontuacao_blog" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"conteudo" text NOT NULL,
	"imagem_url" varchar(500),
	"tipo" "tipo_postagem" DEFAULT 'NOVIDADE' NOT NULL,
	"status" "status_postagem" DEFAULT 'RASCUNHO' NOT NULL,
	"agendado_para" timestamp with time zone,
	"publicado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artigos" ADD CONSTRAINT "artigos_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucoes_agente" ADD CONSTRAINT "execucoes_agente_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pontuacoes_presenca" ADD CONSTRAINT "pontuacoes_presenca_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postagens" ADD CONSTRAINT "postagens_negocio_id_negocios_id_fk" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;