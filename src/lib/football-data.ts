import "server-only";
import type { Round } from "./rounds";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC"; // FIFA World Cup

// football-data.org has used a few stage spellings across competitions; map defensively.
const STAGE_TO_ROUND: Record<string, Round> = {
  LAST_32: "Round of 32",
  ROUND_OF_32: "Round of 32",
  LAST_16: "Round of 16",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter-finals",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINAL: "Semi-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

type FDMatch = {
  id: number;
  utcDate: string | null;
  status: string;
  stage: string;
  homeTeam: { name: string | null } | null;
  awayTeam: { name: string | null } | null;
  score: { winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null } | null;
};

export type MatchStatus = "SCHEDULED" | "IN_PLAY" | "FINISHED";

export type MappedMatch = {
  externalId: string;
  round: Round;
  teamA: string | null;
  teamB: string | null;
  kickoff: Date | null;
  status: MatchStatus;
  qualifier: string | null;
};

function mapStatus(s: string): MatchStatus {
  if (s === "FINISHED" || s === "AWARDED") return "FINISHED";
  if (s === "IN_PLAY" || s === "PAUSED") return "IN_PLAY";
  return "SCHEDULED";
}

// Pure mapper, exported so it can be unit-tested without a network call.
export function mapMatches(raw: { matches?: FDMatch[] }): MappedMatch[] {
  const out: MappedMatch[] = [];
  for (const m of raw.matches ?? []) {
    const round = STAGE_TO_ROUND[m.stage];
    if (!round) continue; // skip group stage / unknown stages
    const teamA = m.homeTeam?.name ?? null;
    const teamB = m.awayTeam?.name ?? null;
    const status = mapStatus(m.status);
    let qualifier: string | null = null;
    if (status === "FINISHED") {
      if (m.score?.winner === "HOME_TEAM") qualifier = teamA;
      else if (m.score?.winner === "AWAY_TEAM") qualifier = teamB;
    }
    out.push({
      externalId: String(m.id),
      round,
      teamA,
      teamB,
      kickoff: m.utcDate ? new Date(m.utcDate) : null,
      status,
      qualifier,
    });
  }
  return out;
}

// Friendly message for a throttled response, using football-data.org's
// `X-RequestCounter-Reset` header (seconds until the request counter resets).
// Exported so it can be unit-tested without a network call.
export function rateLimitMessage(resetSeconds: string | null): string {
  const n = resetSeconds && /^\d+$/.test(resetSeconds) ? Number(resetSeconds) : null;
  return n !== null
    ? `football-data.org rate limit hit — try again in ${n}s.`
    : "football-data.org rate limit hit — wait a minute and try again.";
}

export async function fetchKnockoutMatches(): Promise<MappedMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY is not set");

  const res = await fetch(`${BASE}/competitions/${COMPETITION}/matches`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  // Free tier is ~10 req/min. We make one request per sync, but handle 429 gracefully so a
  // throttled run reports when to retry (via X-RequestCounter-Reset) instead of a raw body.
  // Note: a 200 may still carry X-RequestsAvailable: 0 (this was the last allowed call) — that
  // is not an error, so we only branch on the 429 status.
  if (res.status === 429) {
    throw new Error(rateLimitMessage(res.headers.get("X-RequestCounter-Reset")));
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { matches?: FDMatch[] };
  return mapMatches(data);
}
