"use client";

import { useActionState, useState } from "react";
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
  squad: string[];
};

export default function AdminMatchEditor(p: Props) {
  const [fxState, fxAction, fxPending] = useActionState<AdminState, FormData>(saveFixture, {});
  const [rsState, rsAction, rsPending] = useActionState<AdminState, FormData>(setResult, {});

  const [scorers, setScorers] = useState<string[]>(
    p.scorers.split("\n").map((s) => s.trim()).filter(Boolean)
  );
  const [draft, setDraft] = useState("");

  const addScorer = () => {
    const name = draft.trim();
    if (name) setScorers((cur) => [...cur, name]);
    setDraft("");
  };

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
          <label className="label">Goal scorers</label>
          {/* chips carry the value; an un-added draft is folded in so nothing is lost on Save.
              setResult splits this hidden field on newline/comma and de-dupes. */}
          <input type="hidden" name="scorers" value={[...scorers, draft].map((s) => s.trim()).filter(Boolean).join("\n")} />
          {scorers.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {scorers.map((name, i) => (
                <span key={`${name}-${i}`} className="pill bg-pitch/15 text-pitch-dark">
                  {name}
                  <button
                    type="button"
                    onClick={() => setScorers((cur) => cur.filter((_, j) => j !== i))}
                    className="ml-1 text-pitch-dark/60 hover:text-pitch-dark"
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addScorer();
                }
              }}
              list={`adm-squad-${p.id}`}
              placeholder={p.squad.length ? "Pick or type a scorer" : "Type a scorer"}
              autoComplete="off"
              className="input"
            />
            <button type="button" onClick={addScorer} className="btn-ghost shrink-0">
              Add
            </button>
          </div>
          {p.squad.length > 0 && (
            <datalist id={`adm-squad-${p.id}`}>
              {p.squad.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
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
