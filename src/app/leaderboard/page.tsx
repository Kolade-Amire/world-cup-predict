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
    <div className="space-y-6">
      <AutoRefresh />
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>🏆</span> Leaderboard
        </h1>
        <span className="text-[10px] font-mono font-bold tracking-widest text-pitch-light bg-pitch-light/10 border border-pitch-light/30 px-2.5 py-1 rounded-full uppercase">
          {rows.length} participants
        </span>
      </div>

      {/* Trio Podium */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-3 pb-2 max-w-lg mx-auto">
          {/* 2nd Place */}
          {rows[1] ? (
            <div className="card p-3 flex flex-col items-center justify-center text-center border-gray-400/30 bg-pitch-card/40 h-36 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-400" />
              <span className="text-2xl mb-1" aria-hidden>🥈</span>
              <span className="text-xs font-bold text-gray-200 truncate w-full px-1">{rows[1].name}</span>
              <span className="text-base font-black text-white mt-1.5">{rows[1].total} <span className="text-[9px] font-bold text-gray-500">PTS</span></span>
              <span className="text-[9px] font-semibold text-gray-400 mt-0.5">Q:{rows[1].correctQ} · S:{rows[1].correctS}</span>
            </div>
          ) : (
            <div className="h-36 border border-pitch-border/15 rounded-2xl bg-pitch-deep/5 border-dashed" />
          )}

          {/* 1st Place */}
          {rows[0] ? (
            <div className="card p-4 flex flex-col items-center justify-center text-center border-gold/40 bg-pitch-card/90 h-44 relative overflow-hidden shadow-gold/5 shadow-2xl scale-[1.04] z-10">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold via-yellow-400 to-gold" />
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-gold/10 rounded-full blur-lg pointer-events-none" />
              <span className="text-3xl mb-1" aria-hidden>👑</span>
              <span className="text-sm font-black text-white truncate w-full px-1">{rows[0].name}</span>
              <span className="text-xl font-black text-gold mt-1.5">{rows[0].total} <span className="text-xs font-bold text-gold/60">PTS</span></span>
              <span className="text-[9px] font-bold text-gold-light/80 mt-0.5">Q:{rows[0].correctQ} · S:{rows[0].correctS}</span>
            </div>
          ) : (
            <div className="h-44 border border-pitch-border/15 rounded-2xl bg-pitch-deep/5 border-dashed" />
          )}

          {/* 3rd Place */}
          {rows[2] ? (
            <div className="card p-3 flex flex-col items-center justify-center text-center border-amber-700/30 bg-pitch-card/40 h-32 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-700" />
              <span className="text-2xl mb-0.5" aria-hidden>🥉</span>
              <span className="text-xs font-bold text-gray-200 truncate w-full px-1">{rows[2].name}</span>
              <span className="text-sm font-black text-white mt-1.5">{rows[2].total} <span className="text-[9px] font-bold text-gray-500">PTS</span></span>
              <span className="text-[9px] font-semibold text-gray-400 mt-0.5">Q:{rows[2].correctQ} · S:{rows[2].correctS}</span>
            </div>
          ) : (
            <div className="h-32 border border-pitch-border/15 rounded-2xl bg-pitch-deep/5 border-dashed" />
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">No players yet. Be the first to join!</div>
      ) : (
        <div className="card overflow-hidden border-pitch-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pitch-border/40 bg-pitch-card/60 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3.5 text-center font-extrabold w-12">#</th>
                <th className="px-4 py-3.5 font-extrabold">Player</th>
                <th className="px-3 py-3.5 text-center font-extrabold w-16" title="Correct qualifiers">Qualifiers</th>
                <th className="px-3 py-3.5 text-center font-extrabold w-16" title="Correct scorers">Scorers</th>
                <th className="px-4 py-3.5 text-right font-extrabold w-20">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = r.id === meId;
                const podiumRank = i < 3;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-pitch-border/15 last:border-0 hover:bg-pitch-card/30 transition-colors ${
                      isMe ? "bg-pitch-light/10 text-white border-y border-pitch-light/30" : "text-gray-300"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-400">
                      {podiumRank ? (
                        <span className="text-base">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className={isMe ? "text-pitch-light font-extrabold" : ""}>{r.name}</span>
                        {isMe && (
                          <span className="pill bg-pitch-light/20 text-[9px] text-pitch-light border border-pitch-light/30 font-bold uppercase py-0 px-1.5">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center font-semibold">{r.correctQ}</td>
                    <td className="px-3 py-3.5 text-center font-semibold">{r.correctS}</td>
                    <td className={`px-4 py-3.5 text-right text-base font-black ${
                      isMe ? "text-pitch-light" : "text-white"
                    }`}>
                      {r.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-1 text-[10px] text-gray-500 leading-relaxed font-medium">
        ⚽ <span className="font-bold text-gray-400">Rules:</span> Qualifiers = Correctly predicted teams to advance (+3 pts each) · Scorers = Correctly predicted goal scorers (+5 pts each). Ties are broken by the number of correct scorer hits, followed by alphabetical order.
      </p>
    </div>
  );
}
