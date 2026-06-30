"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionPlayerId } from "@/lib/session";
import { isLocked } from "@/lib/time";

export type PredictState = { error?: string; ok?: boolean };

export async function submitPrediction(_prev: PredictState, formData: FormData): Promise<PredictState> {
  const playerId = await getSessionPlayerId();
  if (!playerId) return { error: "Please log in first." };

  const matchId = String(formData.get("matchId") ?? "");
  const qualifierPick = String(formData.get("qualifierPick") ?? "").trim();
  const scorerPick = String(formData.get("scorerPick") ?? "").trim();

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match not found." };
  if (!match.teamA || !match.teamB || !match.kickoff) return { error: "This match is not open for predictions yet." };
  if (isLocked(match.kickoff)) return { error: "Predictions are closed — the match has kicked off." };

  if (!qualifierPick && !scorerPick) return { error: "Pick a team to qualify and/or a player to score." };
  if (qualifierPick && qualifierPick !== match.teamA && qualifierPick !== match.teamB) {
    return { error: "Qualifier must be one of the two teams." };
  }
  if (scorerPick.length > 40) return { error: "Player name is too long." };
  if (/[,;/\n]| and | & /i.test(scorerPick)) {
    return { error: "Pick just one player to score." };
  }

  // confirm the player still exists (guards stale cookies)
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { error: "Session expired. Please log in again." };

  await prisma.prediction.upsert({
    where: { playerId_matchId: { playerId, matchId } },
    update: { qualifierPick: qualifierPick || null, scorerPick: scorerPick || null },
    create: { playerId, matchId, qualifierPick: qualifierPick || null, scorerPick: scorerPick || null },
  });

  revalidatePath("/");
  revalidatePath("/leaderboard");
  return { ok: true };
}
