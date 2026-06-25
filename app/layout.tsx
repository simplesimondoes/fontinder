import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fontinder — swipe to find the best fonts",
  description:
    "Hot-or-not for embroidery fonts. Swipe right to keep, left to pass. Help us pick the best 25 for the designer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="w-full max-w-md mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🔥</span>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-flame to-sky bg-clip-text text-transparent">
              Fontinder
            </span>
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-white/70 hover:text-white transition rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10"
          >
            🏆 Leaderboard
          </Link>
        </header>
        <main className="flex-1 w-full max-w-md mx-auto px-4 pb-6 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
