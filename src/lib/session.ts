import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const PLAYER_COOKIE = "wcp_session";
const ADMIN_COOKIE = "wcp_admin";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${sig}`;
}

function unsign(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const value = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return value;
}

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function setSession(playerId: string): Promise<void> {
  (await cookies()).set(PLAYER_COOKIE, sign(playerId), baseCookie);
}

export async function getSessionPlayerId(): Promise<string | null> {
  return unsign((await cookies()).get(PLAYER_COOKIE)?.value);
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(PLAYER_COOKIE);
}

export async function setAdmin(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, sign("admin"), baseCookie);
}

export async function isAdmin(): Promise<boolean> {
  return unsign((await cookies()).get(ADMIN_COOKIE)?.value) === "admin";
}

export async function clearAdmin(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
