import "server-only";
import { prisma } from "./db";

// All squads grouped by exact team name, for powering scorer dropdowns.
export async function getSquadsByTeam(): Promise<Map<string, string[]>> {
  const rows = await prisma.squadPlayer.findMany({ orderBy: { name: "asc" } });
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const arr = map.get(r.team) ?? [];
    arr.push(r.name);
    map.set(r.team, arr);
  }
  return map;
}

// The combined, de-duplicated player list for a match's two teams.
export function squadFor(
  map: Map<string, string[]>,
  teamA: string | null,
  teamB: string | null
): string[] {
  const players = [...(teamA ? map.get(teamA) ?? [] : []), ...(teamB ? map.get(teamB) ?? [] : [])];
  return Array.from(new Set(players)).sort((a, b) => a.localeCompare(b));
}
