"use client";

import { useActionState } from "react";
import { saveFixture, setResult, type AdminState } from "@/app/actions/admin";

type Props = {
  id: string;
  code: string | null;
  round: string;
  teamA: string | null;
  teamB: string | null;
  kickoffInput: string; // pre-formatted datetime-local in WAT, or ""
  qualifier: string | null;
  scorers: string; // newline-joined
};

export default function AdminMatchEditor(p: Props) {
  const [fxState, fxAction, fxPending] = useActionState<AdminState, FormData>(saveFixture, {});
  const [rsState, rsAction, rsPending] = useActionState<AdminState, FormData>(setResult, {});

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bold">{p.code ?? p.round}</span>
        <span className="text-xs text-gray-400">{p.round}</span>
      </div>

      {/* Fixture */}
      <form action={fxAction} className="space-y-3">
        <input type="hidden" name="matchId" value={p.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Team A</label>
            <input name="teamA" defaultValue={p.teamA ?? ""} className="input" placeholder="e.g. Nigeria" />
          </div>
          <div>
            <label className="label">Team B</label>
            <input name="teamB" defaultValue={p.teamB ?? ""} className="input" placeholder="e.g. Brazil" />
          </div>
        </div>
        <div>
          <label className="label">Kickoff (WAT)</label>
          <input type="datetime-local" name="kickoff" defaultValue={p.kickoffInput} className="input" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-ghost" disabled={fxPending}>
            {fxPending ? "Saving…" : "Save fixture"}
          </button>
          {fxState.ok && <span className="text-sm text-pitch">{fxState.ok}</span>}
          {fxState.error && <span className="text-sm text-red-600">{fxState.error}</span>}
        </div>
      </form>

      {/* Result */}
      <form action={rsAction} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
        <input type="hidden" name="matchId" value={p.id} />
        <div>
          <label className="label">Qualifier (must match a team name)</label>
          <input name="qualifier" defaultValue={p.qualifier ?? ""} className="input" placeholder="Team that advanced" />
        </div>
        <div>
          <label className="label">Goal scorers (one per line, or comma-separated)</label>
          <textarea name="scorers" defaultValue={p.scorers} rows={3} className="input" placeholder={"Osimhen\nLookman"} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={rsPending}>
            {rsPending ? "Saving…" : "Save result"}
          </button>
          {rsState.ok && <span className="text-sm text-pitch">{rsState.ok}</span>}
          {rsState.error && <span className="text-sm text-red-600">{rsState.error}</span>}
        </div>
      </form>
    </div>
  );
}
