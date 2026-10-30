import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AniVerse | Lançamentos de Animes e Top 10",
    template: "%s | AniVerse"
  },
  description: "Acompanhe os lançamentos de animes da semana, crie seu Top 10 pessoal, converse no chat da comunidade e descubra os animes mais populares da temporada.",
  keywords: ["anime", "lançamentos de anime", "top 10 animes", "calendário de animes", "animes da temporada", "chat de anime"],
  openGraph: {
    title: "AniVerse | Seu portal de animes",
    description: "Acompanhe os lançamentos, monte seu Top 10 e converse com outros fãs de anime.",
    url: "https://aniverse.com.br",
    siteName: "AniVerse",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniVerse | Seu portal de animes",
    description: "Acompanhe os lançamentos, monte seu Top 10 e converse com outros fãs de anime.",
  },
  other: {
    'mylead-verification': '32db5d4576599a2b45af8d6facef1d9e',
  },
};

export default function RootLayout({
  children,
  modal,
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
        <Footer />
        {modal}
      </body>
    </html>
  );
}