import "server-only";
import { prisma } from "./db";
import { fetchKnockoutMatches, fetchSquads } from "./football-data";
import { fetchWorldCupGoals } from "./apifootball";
import { pairKey } from "./teamMatch";
import { ROUND_ORDER, globalOrder } from "./rounds";

// Pull knockout fixtures/results from football-data.org and upsert them by externalId.
// Manually-entered rows (externalId = null) are left untouched.
export async function syncFixtures(): Promise<{ synced: number }> {
  const matches = await fetchKnockoutMatches();

  for (const m of matches) {
    await prisma.match.upsert({
      where: { externalId: m.externalId },
      create: {
        externalId: m.externalId,
        round: m.round,
        teamA: m.teamA,
        teamB: m.teamB,
        kickoff: m.kickoff,
        status: m.status,
        qualifier: m.qualifier,
      },
      update: {
        round: m.round,
        teamA: m.teamA,
        teamB: m.teamB,
        kickoff: m.kickoff,
        status: m.status,
        // Only let the feed set the qualifier once it actually has a result, so a manual
        // qualifier entered in /admin isn't wiped before the API catches up.
        ...(m.qualifier ? { qualifier: m.qualifier } : {}),
      },
    });
  }

  // Assign a global sort key: order within each round by kickoff (nulls last).
  for (const round of ROUND_ORDER) {
    const rows = await prisma.match.findMany({
      where: { round },
      orderBy: [{ kickoff: { sort: "asc", nulls: "last" } }, { externalId: "asc" }],
    });
    await Promise.all(
      rows.map((r, i) => prisma.match.update({ where: { id: r.id }, data: { order: globalOrder(round, i) } }))
    );
  }

  return { synced: matches.length };
}

// Pull team squads from football-data.org and store them for the scorer dropdowns.
// Each team's rows are replaced wholesale so roster changes are reflected.
export async function syncSquads(): Promise<{ teams: number; players: number }> {
  const squads = await fetchSquads();
  let players = 0;
  for (const { team, players: names } of squads) {
    players += names.length;
    await prisma.$transaction([
      prisma.squadPlayer.deleteMany({ where: { team } }),
      prisma.squadPlayer.createMany({
        data: names.map((name) => ({ team, name })),
        skipDuplicates: true,
      }),
    ]);
  }
  return { teams: squads.length, players };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Pull World Cup goal scorers from apifootball and attach them to our (football-data) matches,
// matched by team-pair + date (±1 day). Only non-manual, scheduled matches are touched, so a
// scorer set the admin entered by hand is never overwritten.
export async function syncGoals(): Promise<{ matched: number; events: number }> {
  const candidates = await prisma.match.findMany({
    where: { scorersManual: false, teamA: { not: null }, teamB: { not: null }, kickoff: { not: null } },
  });
  if (!candidates.length) return { matched: 0, events: 0 };

  const kickoffs = candidates.map((m) => m.kickoff!.getTime());
  const from = ymd(new Date(Math.min(...kickoffs) - 24 * 3600_000));
  const to = ymd(new Date(Math.max(...kickoffs) + 24 * 3600_000));

  const events = await fetchWorldCupGoals(from, to);

  // index our matches by team-pair key (knockout pairings are unique among our rows)
  const byPair = new Map<string, typeof candidates>();
  for (const m of candidates) {
    const key = pairKey(m.teamA!, m.teamB!);
    const arr = byPair.get(key) ?? [];
    arr.push(m);
    byPair.set(key, arr);
  }

  let matched = 0;
  for (const ev of events) {
    const rows = byPair.get(pairKey(ev.home, ev.away));
    if (!rows) continue;
    const evTime = ev.date ? new Date(`${ev.date}T12:00:00Z`).getTime() : NaN;
    const match = rows.find(
      (m) => Number.isNaN(evTime) || Math.abs(m.kickoff!.getTime() - evTime) <= 36 * 3600_000
    );
    if (!match) continue;

    // de-dupe scorer names case-insensitively, keeping first spelling
    const seen = new Set<string>();
    const scorers = ev.scorers
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => {
        const k = s.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    await prisma.$transaction([
      prisma.goal.deleteMany({ where: { matchId: match.id } }),
      ...(scorers.length
        ? [prisma.goal.createMany({ data: scorers.map((scorer) => ({ matchId: match.id, scorer })) })]
        : []),
    ]);
    matched++;
  }

  return { matched, events: events.length };
}
