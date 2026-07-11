import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionPlayerId } from "@/lib/session";
import { formatWat, isLocked } from "@/lib/time";
import { qualifyPoints, scorerPoints } from "@/lib/scoring";
import PredictionForm from "@/components/PredictionForm";
import CountryFlag from "@/components/CountryFlag";
import AutoRefresh from "@/components/AutoRefresh";
import { getSquadsByTeam, squadFor } from "@/lib/squads";
import { roundRank } from "@/lib/rounds";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ round?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const playerId = await getSessionPlayerId();
  const player = playerId ? await prisma.player.findUnique({ where: { id: playerId } }) : null;

  const matches = await prisma.match.findMany({
    orderBy: { order: "asc" },
    include: {
      goals: true,
      predictions: { where: { playerId: playerId ?? "__none__" } },
    },
  });

  const squadByTeam = await getSquadsByTeam();

  // Find which rounds actually exist in our matches database and sort them by bracket order
  const existingRounds = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => roundRank(a) - roundRank(b)
  );

  // Await search params in Next.js 15
  const resolvedParams = await searchParams;
  const urlRound = resolvedParams.round;

  // Determine active round: default to the first round containing an unfinished match, or fallback to the first round
  let activeRound = urlRound;
  if (!activeRound || !existingRounds.includes(activeRound)) {
    const upcomingMatch = matches.find((m) => m.status !== "FINISHED");
    activeRound = upcomingMatch ? upcomingMatch.round : (existingRounds[0] || "Round of 32");
  }

  const filteredMatches = matches.filter((m) => m.round === activeRound);

  return (
    <div className="space-y-6">
      <AutoRefresh />

      {!player && (
        <div className="card p-5 bg-gradient-to-br from-pitch-card to-pitch-deep border-pitch-light/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pitch-light/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-sm text-gray-300 leading-relaxed">
            <Link href="/login" className="font-bold text-pitch-light hover:text-pitch-light/80 underline decoration-2 underline-offset-4 transition-colors">
              Log in or join
            </Link>{" "}
            to participate in predictions. For each match, guess the advancing team (+3 pts) and a scorer (+5 pts). Picks lock immediately at kickoff.
          </p>
        </div>
      )}

      {/* Round Selector Tabs */}
      {existingRounds.length > 0 && (
        <div className="flex gap-2 py-1 overflow-x-auto scrollbar-none border-b border-pitch-border/30 pb-3">
          {existingRounds.map((round) => {
            const isActive = round === activeRound;
            const roundMatches = matches.filter((m) => m.round === round);
            const finishedCount = roundMatches.filter((m) => m.status === "FINISHED").length;
            const totalCount = roundMatches.length;

            return (
              <Link
                key={round}
                href={`/?round=${encodeURIComponent(round)}`}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                  isActive
                    ? "bg-pitch-light border-pitch-light text-white shadow-lg shadow-pitch-light/20 scale-105"
                    : "bg-pitch-card/45 border-pitch-border/40 text-gray-400 hover:border-pitch-border hover:bg-pitch-card/80 hover:text-gray-200"
                }`}
              >
                <span>{round}</span>
                {totalCount > 0 && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-pitch-border/60 text-gray-400"
                  }`}>
                    {finishedCount}/{totalCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Match Cards List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-500 border-dashed border-pitch-border/50">
            No matches scheduled for this round.
          </div>
        ) : (
          filteredMatches.map((m) => {
            const open = Boolean(m.teamA && m.teamB && m.kickoff);
            const locked = isLocked(m.kickoff);
            const settled = m.qualifier != null;
            const pred = m.predictions[0] ?? null;

            return (
              <div key={m.id} className="card p-5 relative overflow-hidden group">
                {/* Visual card glow effect on group hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-pitch-light/0 via-pitch-light/3 to-pitch-light/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-pitch-light/75 uppercase">{m.code ?? "MATCH"}</span>
                    <StatusPill open={open} locked={locked} settled={settled} live={m.status === "IN_PLAY"} />
                  </div>

                  {/* Balanced VS Scoreboard layout with country avatars */}
                  <div className="grid grid-cols-5 items-center gap-3 py-3">
                    <div className="col-span-2 flex items-center justify-end gap-2.5">
                      <div className="text-right">
                        <div className={`text-sm md:text-base font-extrabold transition-colors ${
                          settled && m.qualifier === m.teamA ? "text-gold" : "text-white"
                        }`}>
                          {m.teamA ?? "TBD"}
                        </div>
                        {settled && m.qualifier === m.teamA && (
                          <span className="inline-block text-[9px] uppercase font-bold text-gold tracking-widest mt-0.5">Qualified</span>
                        )}
                      </div>
                      <CountryFlag name={m.teamA} variant="badge" />
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-deep border border-pitch-border/80 text-[10px] font-black text-gray-400 shadow-inner">
                        VS
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-start gap-2.5">
                      <CountryFlag name={m.teamB} variant="badge" />
                      <div className="text-left">
                        <div className={`text-sm md:text-base font-extrabold transition-colors ${
                          settled && m.qualifier === m.teamB ? "text-gold" : "text-white"
                        }`}>
                          {m.teamB ?? "TBD"}
                        </div>
                        {settled && m.qualifier === m.teamB && (
                          <span className="inline-block text-[9px] uppercase font-bold text-gold tracking-widest mt-0.5">Qualified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-1 text-center text-xs font-medium text-gray-500">
                    {m.kickoff ? formatWat(m.kickoff) : "Kickoff time pending"}
                  </p>

                  {/* Prediction input form or display */}
                  {!open && (
                    <div className="mt-4 border-t border-pitch-border/20 pt-4 text-center text-xs text-gray-500 italic">
                      Fixture details not locked in yet.
                    </div>
                  )}

                  {open && !locked && player && (
                    <div className="mt-2 border-t border-pitch-border/20 pt-3">
                      <PredictionForm
                        matchId={m.id}
                        teamA={m.teamA!}
                        teamB={m.teamB!}
                        currentQualifier={pred?.qualifierPick ?? null}
                        currentScorer={pred?.scorerPick ?? null}
                        squad={squadFor(squadByTeam, m.teamA, m.teamB)}
                      />
                    </div>
                  )}

                  {open && !locked && !player && (
                    <div className="mt-4 border-t border-pitch-border/20 pt-4 text-center text-xs text-gray-400">
                      <Link href="/login" className="font-bold text-pitch-light hover:underline">
                        Log in
                      </Link>{" "}
                      to submit predictions.
                    </div>
                  )}

                  {open && locked && (
                    <LockedView
                      pred={pred}
                      qualifier={m.qualifier}
                      goals={m.goals}
                      qPts={pred ? qualifyPoints(pred, m) : 0}
                      sPts={pred ? scorerPoints(pred, m) : 0}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusPill({
  open,
  locked,
  settled,
  live,
}: {
  open: boolean;
  locked: boolean;
  settled: boolean;
  live: boolean;
}) {
  if (!open) return <span className="pill bg-pitch-deep/80 text-gray-500 border border-pitch-border/40">TBD</span>;
  if (settled) return <span className="pill bg-gold/10 text-gold-light border border-gold/30">Result in</span>;
  if (live) return <span className="pill bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">🔴 Live</span>;
  if (locked) return <span className="pill bg-amber-500/10 text-amber-400 border border-amber-500/30">Locked</span>;
  return <span className="pill bg-pitch-light/10 text-pitch-light border border-pitch-light/30">Open</span>;
}

function LockedView({
  pred,
  qualifier,
  goals,
  qPts,
  sPts,
}: {
  pred: { qualifierPick: string | null; scorerPick: string | null } | null;
  qualifier: string | null;
  goals: { scorer: string }[];
  qPts: number;
  sPts: number;
}) {
  return (
    <div className="mt-4 space-y-3 border-t border-pitch-border/30 pt-4 text-xs">
      {pred ? (
        <div className="grid grid-cols-2 gap-3 bg-pitch-deep/40 rounded-xl p-3 border border-pitch-border/25">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Qualifier</span>
            <div className="flex items-center gap-1.5 font-semibold text-gray-200">
              <span className="truncate">{pred.qualifierPick ?? "—"}</span>
              {qPts > 0 ? (
                <span className="pill bg-pitch-light/20 text-pitch-light border border-pitch-light/30 text-[10px] px-1.5 py-0">+3</span>
              ) : (
                pred.qualifierPick && qualifier && <span className="text-[10px] font-bold text-red-500/80">✗</span>
              )}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Scorer</span>
            <div className="flex items-center gap-1.5 font-semibold text-gray-200">
              <span className="truncate max-w-[110px]">{pred.scorerPick ?? "—"}</span>
              {sPts > 0 ? (
                <span className="pill bg-pitch-light/20 text-pitch-light border border-pitch-light/30 text-[10px] px-1.5 py-0">+5</span>
              ) : (
                pred.scorerPick && goals.length > 0 && <span className="text-[10px] font-bold text-red-500/80">✗</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-pitch-deep/20 border border-pitch-border/20 py-2.5 px-3 text-center text-gray-500 text-[11px] italic">
          No predictions submitted.
        </div>
      )}

      {(qualifier || goals.length > 0) && (
        <div className="rounded-xl bg-pitch-deep/50 border border-pitch-border/30 p-3 space-y-2">
          {qualifier && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Qualified team:</span>
              <span className="font-extrabold text-gold">{qualifier}</span>
            </div>
          )}
          {goals.length > 0 && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-400 shrink-0">Scorers:</span>
              <span className="font-semibold text-gray-200 text-right">
                {goals.map((g) => g.scorer).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
