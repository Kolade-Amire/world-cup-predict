"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";

export type AuthState = { error?: string };

function validName(name: string): string | null {
  const n = name.trim();
  if (n.length < 2) return "Name must be at least 2 characters.";
  if (n.length > 24) return "Name must be 24 characters or fewer.";
  return null;
}

function validPin(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "PIN must be exactly 4 digits.";
  return null;
}

export async function join(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const nameErr = validName(name);
  if (nameErr) return { error: nameErr };
  const pinErr = validPin(pin);
  if (pinErr) return { error: pinErr };
  if (pin !== confirm) return { error: "PINs do not match." };

  const nameKey = name.toLowerCase();
  const existing = await prisma.player.findUnique({ where: { nameKey } });
  if (existing) return { error: "That name is taken. Pick another or log in instead." };

  const pinHash = await bcrypt.hash(pin, 10);
  const player = await prisma.player.create({ data: { name, nameKey, pinHash } });
  await setSession(player.id);
  redirect("/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  if (!name || !pin) return { error: "Enter your name and PIN." };

  const player = await prisma.player.findUnique({ where: { nameKey: name.toLowerCase() } });
  if (!player) return { error: "No player with that name. Tap “Join” to register." };

  const ok = await bcrypt.compare(pin, player.pinHash);
  if (!ok) return { error: "Wrong PIN." };

  await setSession(player.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
