"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Normaliza a URL base garantindo que tenha o protocolo (http/https).
 * O Vercel geralmente disponibiliza apenas o domínio (ex: meudominio.vercel.app),
 * o que quebra o fetch no frontend se não tiver https://
 */
const obterBaseURL = () => {
  const urlBase = process.env.NEXT_PUBLIC_APP_URL;
  if (!urlBase) return undefined; // Deixa o better-auth inferir a rota relativa (/api/auth)
  if (urlBase.startsWith("http")) return urlBase;
  return `https://${urlBase}`;
};

/**
 * Cliente de autenticação para componentes React.
 * Fornece hooks como useSession, signIn, signOut.
 */
const clienteAuth = createAuthClient({
  baseURL: obterBaseURL(),
});

export const { signIn, signOut, signUp, useSession } = clienteAuth;
export default clienteAuth;
