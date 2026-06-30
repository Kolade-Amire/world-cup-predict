// Single source of truth for the 48-team knockout rounds, in bracket order.
export const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Third place",
  "Final",
] as const;

export type Round = (typeof ROUND_ORDER)[number];

export function roundRank(round: string): number {
  const i = (ROUND_ORDER as readonly string[]).indexOf(round);
  return i < 0 ? 99 : i;
}

// A global, sortable key so a single `orderBy: { order: "asc" }` keeps matches grouped by
// round and ordered within each round. Each round has < 100 matches, so this never overlaps.
export function globalOrder(round: string, indexInRound: number): number {
  return roundRank(round) * 100 + indexInRound;
}
