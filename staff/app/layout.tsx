import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panel zarządzania",
  description: "Panel zarządzania",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <AuthProvider>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <AuthGate>{children}</AuthGate>
      </body>
      </AuthProvider>
    </html>
  );
}
