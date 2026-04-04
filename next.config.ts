import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ===== Configuração do LocalSEO ===== */

  // Forçar variáveis de ambiente do servidor (bypassa dotenv-expand que engole o $ da chave Asaas)
  env: {
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    ASAAS_ENVIRONMENT: process.env.ASAAS_ENVIRONMENT || "sandbox",
    ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN,
  },


  // Imagens externas permitidas (Unsplash + Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "sokskmuynndtjthuikgb.supabase.co",
      },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
