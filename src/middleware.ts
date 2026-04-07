import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const tokenSessao = request.cookies.get("better-auth.session_token")?.value;

  // 1. Extração do Subdomínio
  const isLocalhost = hostname.includes("localhost:") || hostname.includes("127.0.0.1:");
  const dominioPrincipal = isLocalhost ? "localhost:3000" : "localseo.com.br";

  let subdominio: string | null = null;

  // Suporte a ?subdomain= para testes locais (sem precisar de subdomínio real)
  const subdomainParam = url.searchParams.get("subdomain");
  if (subdomainParam && isLocalhost) {
    subdominio = subdomainParam;
  } else if (hostname !== dominioPrincipal) {
    if (isLocalhost) {
      subdominio = hostname.replace(".localhost:3000", "");
    } else {
      subdominio = hostname.replace(`.${dominioPrincipal}`, "");
    }
  }

  // 2. Proteção de Rotas do Painel SaaS
  const pathname = url.pathname;
  const ehRotaProtegida = pathname.startsWith("/painel");
  const ehRotaAuth = pathname.startsWith("/login") || pathname.startsWith("/cadastro");

  if (!subdominio) {
    if (ehRotaProtegida && !tokenSessao) {
      const urlLogin = new URL("/login", request.url);
      urlLogin.searchParams.set("redirecionar", pathname);
      return NextResponse.redirect(urlLogin);
    }

    if (ehRotaAuth && tokenSessao) {
      return NextResponse.redirect(new URL("/painel", request.url));
    }
  }

  // 3. Rewrite Silencioso de Subdomínios
  // barbearia.localseo.com.br/contato -> /site/barbearia/contato
  // localhost:3000?subdomain=barbearia -> /site/barbearia (em dev)
  if (subdominio && subdominio !== hostname) {
    const targetPath = `/site/${subdominio}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
