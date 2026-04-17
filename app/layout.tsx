import type { Metadata } from "next";

import "@/app/global.css";

export const metadata: Metadata = {
  title: "Controle de Equipamentos - Cervejaria Bergway",
  description: "Gestao moderna de equipamentos.",
  icons: {
    icon: "/logoBergway.ico",
    shortcut: "/logoBergway.ico",
    apple: "/logoBergway.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
