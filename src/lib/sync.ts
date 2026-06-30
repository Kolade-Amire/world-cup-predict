import "server-only";
import { prisma } from "./db";
import { fetchKnockoutMatches, fetchSquads } from "./football-data";
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
