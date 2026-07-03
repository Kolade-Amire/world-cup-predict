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

// Decide if a predicted name and a recorded scorer name refer to the same player, across the
// different formats in play: surname-only ("Osimhen"), full name from the squad dropdown
// ("Victor Osimhen"), and initial+surname from apifootball ("V. Osimhen"). Two rules, OR'd:
//   1. surname (last token) matches — the reliable anchor that bridges "Amad Diallo" vs "A. Diallo"
//   2. one name's whole word-set is a subset of the other's (handles word-order + multi-word names)
// Trade-off: two players sharing a surname in the same match can't be told apart from a bare
// surname — accepted (rare, and predictions are surname-led anyway).
export function scorerMatches(pick: string | null | undefined, scorer: string | null | undefined): boolean {
  const a = nameTokens(pick);
  const b = nameTokens(scorer);
  if (!a.length || !b.length) return false;

  const surnameA = a[a.length - 1];
  const surnameB = b[b.length - 1];
  if (surnameA.length >= 2 && surnameA === surnameB) return true; // ignore lone initials like "a."

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
