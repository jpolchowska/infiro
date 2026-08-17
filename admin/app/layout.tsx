import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panel administratora",
  description: "Panel administratora Infiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <span className="text-lg font-semibold text-infiro-navy">
              Panel administratora
            </span>
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link href="/" className="text-infiro-navy hover:opacity-70">
                  Sekcje
                </Link>
                <Link href="/results" className="text-gray-600 hover:text-infiro-navy">
                  Wyniki uczniów
                </Link>
                <Link href="/import" className="text-gray-600 hover:text-infiro-navy">
                  Import treści
                </Link>
              </nav>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
