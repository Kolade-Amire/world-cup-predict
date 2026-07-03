import "server-only";

// apifootball.com — used ONLY for goal scorers (football-data.org's tier doesn't expose them).
// World Cup lives under league_id 28. Auth is an APIkey query param.
const BASE = "https://apiv3.apifootball.com";
const WORLD_CUP_LEAGUE_ID = "28";

type FDGoal = { home_scorer?: string; away_scorer?: string };
type FDEvent = {
  match_hometeam_name?: string;
  match_awayteam_name?: string;
  match_date?: string; // "YYYY-MM-DD"
  goalscorer?: FDGoal[] | null;
};

export type EventGoals = { home: string; away: string; date: string; scorers: string[] };

// Pure mapper, exported for unit tests. Pulls the non-empty scorer names from each event.
export function mapGoals(raw: unknown): EventGoals[] {
  if (!Array.isArray(raw)) return []; // apifootball returns {error,...} (an object) on failure
  const out: EventGoals[] = [];
  for (const e of raw as FDEvent[]) {
    const home = (e.match_hometeam_name ?? "").trim();
    const away = (e.match_awayteam_name ?? "").trim();
    if (!home || !away) continue;
    const scorers: string[] = [];
    for (const g of e.goalscorer ?? []) {
      const h = (g.home_scorer ?? "").trim();
      const a = (g.away_scorer ?? "").trim();
      if (h) scorers.push(h);
      if (a) scorers.push(a);
    }
    out.push({ home, away, date: (e.match_date ?? "").trim(), scorers });
  }
  return out;
}

// from/to are "YYYY-MM-DD" (inclusive).
export async function fetchWorldCupGoals(from: string, to: string): Promise<EventGoals[]> {
  const key = process.env.APIFOOTBALL_API_KEY;
  if (!key) throw new Error("APIFOOTBALL_API_KEY is not set");

  const url = `${BASE}/?action=get_events&from=${from}&to=${to}&league_id=${WORLD_CUP_LEAGUE_ID}&APIkey=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`apifootball ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data: unknown = await res.json();
  // On errors apifootball returns a 200 with { error: <code>, message: "..." } instead of an array.
  if (!Array.isArray(data)) {
    const msg = (data as { message?: string })?.message ?? "unexpected response";
    throw new Error(`apifootball: ${msg}`);
  }
  return mapGoals(data);
}
