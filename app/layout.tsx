import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KERNEL — Prompt Optimizer",
  description: "Production-grade prompt engineering powered by doctrine 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen flex flex-col font-sans">
        <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm tracking-widest text-zinc-100">
              KERNEL
            </span>
            <span className="text-zinc-600 text-xs">prompt optimizer v3</span>
          </div>
          <nav className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-200 transition-colors">Editor</Link>
            <Link href="/history" className="hover:text-zinc-200 transition-colors">History</Link>
            <Link href="/evals" className="hover:text-zinc-200 transition-colors">Evals</Link>
            <Link href="/admin" className="hover:text-zinc-200 transition-colors">Admin</Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
