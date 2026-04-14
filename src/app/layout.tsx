import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Footmillion VIP — Palpites Desportivos Premium",
  description:
    "Junta-te ao grupo VIP de palpites desportivos mais lucrativo de Portugal. Resultados comprovados, comunidade exclusiva.",
  keywords: ["apostas desportivas", "palpites", "VIP", "futebol", "Footmillion"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-[#050505] text-white">
        {children}
      </body>
    </html>
  );
}
