import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RikoSEO — Presença Digital no Piloto Automático",
  description:
    "IA que responde avaliações, cria posts no Google, escreve artigos SEO e monitora sua presença local — tudo automaticamente para negócios locais.",
  keywords: [
    "SEO local",
    "Google Meu Negócio",
    "avaliações Google",
    "presença digital",
    "marketing local",
    "IA para negócios",
  ],
  authors: [{ name: "RikoSEO" }],
  openGraph: {
    title: "RikoSEO — Presença Digital no Piloto Automático",
    description:
      "IA que gerencia sua presença no Google automaticamente. Avaliações, posts, blog SEO e muito mais.",
    type: "website",
    locale: "pt_BR",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
