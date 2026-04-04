"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de autenticação para componentes React.
 * O baseURL é omitido para que o Better-Auth utilize a URL relativa (/api/auth) e 
 * se adapte automaticamente a qualquer domínio (localhost ou Vercel).
 */
const clienteAuth = createAuthClient();

export const { signIn, signOut, signUp, useSession } = clienteAuth;
export default clienteAuth;
