"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin, setAdmin, clearAdmin } from "@/lib/session";
import { watInputToUtc } from "@/lib/time";
import { syncFixtures as runSync } from "@/lib/sync";

export type AdminState = { error?: string; ok?: string };

export async function syncFixtures(_prev: AdminState, _formData: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { error: "Not authorized." };
  try {
    const { synced } = await runSync();
    revalidatePath("/");
    revalidatePath("/leaderboard");
    revalidatePath("/admin");
    return { ok: `Synced ${synced} matches from the API.` };
  } catch (e) {
    return { error: `Sync failed: ${e instanceof Error ? e.message : "unknown error"}` };
  }
}

export async function adminLogin(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "ADMIN_PASSWORD is not set on the server." };
  if (password !== expected) return { error: "Wrong password." };
  await setAdmin();
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdmin();
  redirect("/admin");
}

export async function saveFixture(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const matchId = String(formData.get("matchId") ?? "");
  const teamA = String(formData.get("teamA") ?? "").trim();
  const teamB = String(formData.get("teamB") ?? "").trim();
  const kickoffLocal = String(formData.get("kickoff") ?? "").trim();

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match not found." };

  let kickoff: Date | null = match.kickoff;
  if (kickoffLocal) {
    try {
      kickoff = watInputToUtc(kickoffLocal);
    } catch {
      return { error: "Invalid kickoff date/time." };
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      teamA: teamA || null,
      teamB: teamB || null,
      kickoff,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: `Saved fixture ${match.code}.` };
}

export async function setResult(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { error: "Not authorized." };

  const matchId = String(formData.get("matchId") ?? "");
  const qualifier = String(formData.get("qualifier") ?? "").trim();
  const scorersRaw = String(formData.get("scorers") ?? "");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match not found." };
  if (qualifier && qualifier !== match.teamA && qualifier !== match.teamB) {
    return { error: "Qualifier must be one of the two teams (or blank to clear)." };
  }

  const scorers = scorersRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.match.update({ where: { id: matchId }, data: { qualifier: qualifier || null } }),
    prisma.goal.deleteMany({ where: { matchId } }),
    ...(scorers.length ? [prisma.goal.createMany({ data: scorers.map((scorer) => ({ matchId, scorer })) })] : []),
  ]);

  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  return { ok: `Saved result for ${match.code}.` };
}
