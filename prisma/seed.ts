import { PrismaClient } from "@prisma/client";
import { globalOrder } from "../src/lib/rounds";

const prisma = new PrismaClient();

// FALLBACK ONLY. Normally you populate matches with the "Sync fixtures from API" button in
// /admin (which creates rows keyed by externalId). Run this seed instead only if the API
// doesn't cover the tournament — it lays out the empty 48-team knockout bracket so you can
// fill teams/kickoff/results by hand. Do not run both: sync rows + seeded rows would coexist.
const ROUNDS: { round: string; count: number; prefix: string }[] = [
  { round: "Round of 32", count: 16, prefix: "R32" },
  { round: "Round of 16", count: 8, prefix: "R16" },
  { round: "Quarter-finals", count: 4, prefix: "QF" },
  { round: "Semi-finals", count: 2, prefix: "SF" },
  { round: "Third place", count: 1, prefix: "TP" },
  { round: "Final", count: 1, prefix: "FINAL" },
];

async function main() {
  let total = 0;
  for (const { round, count, prefix } of ROUNDS) {
    for (let i = 0; i < count; i++) {
      const code = count === 1 ? prefix : `${prefix}-${i + 1}`;
      await prisma.match.upsert({
        where: { code },
        update: { round, order: globalOrder(round, i) },
        create: { code, round, order: globalOrder(round, i) },
      });
      total++;
    }
  }
  console.log(`Seeded ${total} knockout match slots (48-team bracket).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
