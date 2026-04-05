CREATE TABLE "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"negocio_id" uuid NOT NULL,
	"servico_foco" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"is_principal" boolean DEFAULT false NOT NULL,
	"headline" varchar(500),
	"subtitulo" text,
	"servicos" jsonb,
	"diferencial" text,
	"tom_voz" varchar(50),
	"whatsapp" varchar(20),
	"cor_primaria" varchar(7),
	"imagem_destaque" varchar(500),
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "telefone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "endereco" text;