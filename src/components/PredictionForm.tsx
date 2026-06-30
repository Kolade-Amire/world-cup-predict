"use client";

import { useActionState } from "react";
import { submitPrediction, type PredictState } from "@/app/actions/predictions";

type Props = {
  matchId: string;
  teamA: string;
  teamB: string;
  currentQualifier: string | null;
  currentScorer: string | null;
  squad: string[];
};

export default function PredictionForm({ matchId, teamA, teamB, currentQualifier, currentScorer, squad }: Props) {
  const [state, action, pending] = useActionState<PredictState, FormData>(submitPrediction, {});

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="matchId" value={matchId} />

      <div>
        <span className="label">Who qualifies? <span className="text-gray-400">(+3)</span></span>
        <div className="grid grid-cols-2 gap-2">
          {[teamA, teamB].map((team) => (
            <label
              key={team}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium has-[:checked]:border-pitch has-[:checked]:bg-pitch/10"
            >
              <input
                type="radio"
                name="qualifierPick"
                value={team}
                defaultChecked={currentQualifier === team}
                className="accent-pitch"
              />
              {team}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`scorer-${matchId}`}>
          Player to score <span className="text-gray-400">(+5)</span>
        </label>
        <input
          id={`scorer-${matchId}`}
          name="scorerPick"
          list={`scorer-list-${matchId}`}
          defaultValue={currentScorer ?? ""}
          placeholder={squad.length ? "Pick or type one player" : "One player (e.g. Osimhen)"}
          autoComplete="off"
          className="input"
        />
        {squad.length > 0 && (
          <datalist id={`scorer-list-${matchId}`}>
            {squad.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save pick"}
        </button>
        {state.ok && <span className="text-sm font-medium text-pitch">Saved ✓</span>}
        {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
