export const QUALIFY_POINTS = 3;
export const SCORER_POINTS = 5;

// Normalize a player name so "Mbappé", "MBAPPE" and " mbappe " all match.
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type PredictionLike = { qualifierPick: string | null; scorerPick: string | null };
type MatchLike = { qualifier: string | null; goals: { scorer: string }[] };

function nameTokens(name: string | null | undefined): string[] {
  return normalizeName(name).split(" ").filter(Boolean);
}

// Two names match if one's word set is a subset of the other's. This reconciles surname-only
// predictions ("Osimhen") with full-name recorded scorers ("Victor Osimhen") and vice versa,
// regardless of word order — so picks made before the squad dropdown existed still count.
export function scorerMatches(pick: string | null | undefined, scorer: string | null | undefined): boolean {
  const a = nameTokens(pick);
  const b = nameTokens(scorer);
  if (!a.length || !b.length) return false;
  const [small, big] = a.length <= b.length ? [a, new Set(b)] : [b, new Set(a)];
  return small.every((t) => big.has(t));
}

export function qualifyPoints(pred: PredictionLike, match: MatchLike): number {
  if (!match.qualifier || !pred.qualifierPick) return 0;
  return pred.qualifierPick === match.qualifier ? QUALIFY_POINTS : 0;
}

export function scorerPoints(pred: PredictionLike, match: MatchLike): number {
  if (!pred.scorerPick) return 0;
  const hit = match.goals.some((g) => scorerMatches(pred.scorerPick, g.scorer));
  return hit ? SCORER_POINTS : 0;
}

export function predictionPoints(pred: PredictionLike, match: MatchLike): number {
  return qualifyPoints(pred, match) + scorerPoints(pred, match);
}
