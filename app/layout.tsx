import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AniVerse | Lançamentos e Top 10",
  description: "Acompanhe os lançamentos da semana e crie seu Top 10 de animes.",
};

export default function RootLayout({
  children,
  modal, // <-- O Next.js vai injetar a rota interceptada aqui
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-bg`}>
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-12">
          {children}
        </main>
        
        {/* O Modal será renderizado aqui (por cima da Home) */}
        {modal}
      </body>
    </html>
  );
}