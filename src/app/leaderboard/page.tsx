import { prisma } from "@/lib/db";
import { getSessionPlayerId } from "@/lib/session";
import { qualifyPoints, scorerPoints } from "@/lib/scoring";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const meId = await getSessionPlayerId();

  const players = await prisma.player.findMany({
    include: {
      predictions: { include: { match: { include: { goals: true } } } },
    },
  });

  const rows = players
    .map((p) => {
      let qPts = 0;
      let sPts = 0;
      let correctQ = 0;
      let correctS = 0;
      for (const pred of p.predictions) {
        const q = qualifyPoints(pred, pred.match);
        const s = scorerPoints(pred, pred.match);
        qPts += q;
        sPts += s;
        if (q > 0) correctQ++;
        if (s > 0) correctS++;
      }
      return {
        id: p.id,
        name: p.name,
        played: p.predictions.length,
        qPts,
        sPts,
        total: qPts + sPts,
        correctQ,
        correctS,
      };
    })
    .sort((a, b) => b.total - a.total || b.correctS - a.correctS || a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <h1 className="text-xl font-extrabold">Leaderboard</h1>

      {rows.length === 0 ? (
        <div className="card p-6 text-center text-sm text-gray-500">No players yet. Be the first to join!</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-2 py-2 text-center" title="Correct qualifiers">Q</th>
                <th className="px-2 py-2 text-center" title="Correct scorers">S</th>
                <th className="px-3 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-gray-100 last:border-0 ${r.id === meId ? "bg-pitch/5" : ""}`}
                >
                  <td className="px-3 py-3 text-center font-bold text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-semibold">
                    {r.name}
                    {r.id === meId && <span className="ml-1 text-xs font-normal text-pitch">(you)</span>}
                  </td>
                  <td className="px-2 py-3 text-center text-gray-600">{r.correctQ}</td>
                  <td className="px-2 py-3 text-center text-gray-600">{r.correctS}</td>
                  <td className="px-3 py-3 text-right text-base font-extrabold text-pitch-dark">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-1 text-xs text-gray-400">
        Q = correct qualifiers (3 pts each) · S = correct scorers (5 pts each). Ties broken by correct scorers.
      </p>
    </div>
  );
}
