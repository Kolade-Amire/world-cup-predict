import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionPlayerId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { logout } from "./actions/auth";

export const metadata: Metadata = {
  title: "2026 World Cup Knockout Predictor",
  description: "World Cup knockout prediction challenge",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b6e3b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const playerId = await getSessionPlayerId();
  const player = playerId ? await prisma.player.findUnique({ where: { id: playerId } }) : null;

  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
          <header className="sticky top-0 z-10 border-b border-pitch-dark/30 bg-pitch text-white">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
                <span aria-hidden>⚽</span>World Cup Knockout Predictor
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold">
                <Link href="/leaderboard" className="hover:underline">
                  Table
                </Link>
                {player ? (
                  <form action={logout}>
                    <button className="opacity-90 hover:underline" type="submit">
                      {player.name} · Sign out
                    </button>
                  </form>
                ) : (
                  <Link href="/login" className="hover:underline">
                    Log in
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1 px-4 py-5">{children}</main>
          <footer className="px-4 py-6 text-center text-xs text-gray-400">
            Predictions lock at kickoff (WAT). 3 pts correct qualifier · 5 pts correct scorer.
          </footer>
        </div>
      </body>
    </html>
  );
}
