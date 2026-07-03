import { normalizeName } from "./scoring";

// Known national-team name differences between football-data.org and apifootball.com.
// Keys and values are normalized (lowercase, accents stripped). Extend as gaps surface.
const TEAM_ALIASES: Record<string, string> = {
  "korea republic": "south korea",
  "republic of korea": "south korea",
  "cote d'ivoire": "ivory coast",
  "united states": "usa",
  "china pr": "china",
  "ir iran": "iran",
  "iran islamic republic of": "iran",
  turkiye: "turkey",
  // confirmed via live football-data vs apifootball spellings (2026 WC)
  "bosnia-herzegovina": "bosnia",
  "bosnia & herzegovina": "bosnia",
  "cape verde islands": "cape verde",
  "congo dr": "dr congo",
  "d.r. congo": "dr congo",
};

export function canonTeam(name: string): string {
  const n = normalizeName(name);
  return TEAM_ALIASES[n] ?? n;
}

// Order-independent key for a fixture's two teams (so home/away order doesn't matter across providers).
export function pairKey(a: string, b: string): string {
  return [canonTeam(a), canonTeam(b)].sort().join("|");
}
