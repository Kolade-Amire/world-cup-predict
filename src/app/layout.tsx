import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import "./globals.css";
import { getSessionPlayerId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { logout } from "./actions/auth";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "2026 World Cup Knockout Predictor",
  description: "World Cup knockout prediction challenge",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07150e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const playerId = await getSessionPlayerId();
  const player = playerId ? await prisma.player.findUnique({ where: { id: playerId } }) : null;

  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="font-sans">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
          <header className="sticky top-0 z-30 w-full border-b border-pitch-border/50 bg-pitch-deep/75 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white hover:opacity-90 transition-opacity">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pitch-light/20 text-pitch-light border border-pitch-light/30" aria-hidden>⚽</span>
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Knockout Predictor</span>
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold">
                <Link href="/leaderboard" className="rounded-lg px-2.5 py-1.5 text-gray-300 hover:bg-pitch-border/30 hover:text-white transition-colors">
                  Table
                </Link>
                {player ? (
                  <form action={logout} className="inline">
                    <button className="rounded-lg bg-pitch-border/50 border border-pitch-border/80 px-3 py-1.5 text-gray-200 hover:bg-pitch-border hover:text-white transition-all" type="submit">
                      <span className="font-bold text-pitch-light">{player.name}</span> <span className="opacity-60 text-xs">· Sign out</span>
                    </button>
                  </form>
                ) : (
                  <Link href="/login" className="rounded-lg bg-pitch-light px-3.5 py-1.5 text-white hover:bg-pitch-light/90 transition-colors shadow-md shadow-pitch-light/10">
                    Log in
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1 px-4 py-6">{children}</main>
          <footer className="px-4 py-8 text-center text-xs text-gray-500 border-t border-pitch-border/20 mt-8">
            <p>Predictions lock at kickoff (WAT).</p>
            <p className="mt-1 text-gray-600">3 pts for correct qualifier · 5 pts for correct scorer.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
