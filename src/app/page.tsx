import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionPlayerId } from "@/lib/session";
import { formatWat, isLocked } from "@/lib/time";
import { qualifyPoints, scorerPoints } from "@/lib/scoring";
import PredictionForm from "@/components/PredictionForm";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const playerId = await getSessionPlayerId();
  const player = playerId ? await prisma.player.findUnique({ where: { id: playerId } }) : null;

  const matches = await prisma.match.findMany({
    orderBy: { order: "asc" },
    include: {
      goals: true,
      predictions: { where: { playerId: playerId ?? "__none__" } },
    },
  });

  let lastRound = "";

  return (
    <div className="space-y-4">
      <AutoRefresh />
      {!player && (
        <div className="card p-4">
          <p className="text-sm text-gray-700">
            <Link href="/login" className="font-semibold text-pitch underline">
              Log in or join
            </Link>{" "}
            to make your picks. Each match: pick who qualifies (+3) and a player to score (+5). Locks at kickoff.
          </p>
        </div>
      )}

      {matches.map((m) => {
        const open = Boolean(m.teamA && m.teamB && m.kickoff);
        const locked = isLocked(m.kickoff);
        const settled = m.qualifier != null;
        const pred = m.predictions[0] ?? null;
        const showRound = m.round !== lastRound;
        lastRound = m.round;

        return (
          <div key={m.id}>
            {showRound && (
              <h2 className="mb-2 mt-5 px-1 text-sm font-bold uppercase tracking-wide text-gray-500">{m.round}</h2>
            )}
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">{m.code ?? ""}</span>
                <StatusPill open={open} locked={locked} settled={settled} live={m.status === "IN_PLAY"} />
              </div>

              <div className="flex items-center justify-between text-lg font-bold">
                <span className={m.qualifier === m.teamA ? "text-pitch" : ""}>{m.teamA ?? "TBD"}</span>
                <span className="px-2 text-sm font-normal text-gray-400">vs</span>
                <span className={m.qualifier === m.teamB ? "text-pitch" : ""}>{m.teamB ?? "TBD"}</span>
              </div>

              <p className="mt-1 text-sm text-gray-500">{m.kickoff ? formatWat(m.kickoff) : "Kickoff to be confirmed"}</p>

              {/* Prediction area */}
              {!open && <p className="mt-3 text-sm text-gray-400">Fixture not set yet — check back soon.</p>}

              {open && !locked && player && (
                <PredictionForm
                  matchId={m.id}
                  teamA={m.teamA!}
                  teamB={m.teamB!}
                  currentQualifier={pred?.qualifierPick ?? null}
                  currentScorer={pred?.scorerPick ?? null}
                />
              )}

              {open && !locked && !player && (
                <p className="mt-3 text-sm">
                  <Link href="/login" className="font-semibold text-pitch underline">
                    Log in
                  </Link>{" "}
                  to predict this match.
                </p>
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
      })}
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
  if (!open) return <span className="pill bg-gray-100 text-gray-500">Not scheduled</span>;
  if (settled) return <span className="pill bg-pitch/15 text-pitch-dark">Result in</span>;
  if (live) return <span className="pill bg-red-100 text-red-700">🔴 Live</span>;
  if (locked) return <span className="pill bg-amber-100 text-amber-700">Locked · awaiting result</span>;
  return <span className="pill bg-emerald-100 text-emerald-700">Open</span>;
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
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm">
      {pred ? (
        <div className="space-y-1">
          <p>
            <span className="text-gray-500">Your qualifier:</span>{" "}
            <span className="font-medium">{pred.qualifierPick ?? "—"}</span>{" "}
            {qPts > 0 && <span className="pill bg-pitch/15 text-pitch-dark">+3</span>}
          </p>
          <p>
            <span className="text-gray-500">Your scorer:</span>{" "}
            <span className="font-medium">{pred.scorerPick ?? "—"}</span>{" "}
            {sPts > 0 && <span className="pill bg-pitch/15 text-pitch-dark">+5</span>}
          </p>
        </div>
      ) : (
        <p className="text-gray-400">You didn’t predict this match.</p>
      )}

      {(qualifier || goals.length > 0) && (
        <div className="rounded-xl bg-gray-50 p-2 text-gray-600">
          {qualifier && (
            <p>
              <span className="text-gray-500">Qualified:</span> <span className="font-semibold">{qualifier}</span>
            </p>
          )}
          {goals.length > 0 && (
            <p>
              <span className="text-gray-500">Scorers:</span> {goals.map((g) => g.scorer).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
