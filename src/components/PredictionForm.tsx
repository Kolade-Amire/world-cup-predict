"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState } from "react";
import { submitPrediction, type PredictState } from "@/app/actions/predictions";
import CountryFlag from "@/components/CountryFlag";

const ScorerPickerModal = dynamic(() => import("@/components/ScorerPickerModal"), {
  loading: () => null,
  ssr: false,
});

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(currentScorer);

  // Sync state with parent props if they change externally
  useEffect(() => {
    setSelectedPlayer(currentScorer);
  }, [currentScorer]);

  return (
    <form action={action} className="mt-3 space-y-4">
      <input type="hidden" name="matchId" value={matchId} />

      <div>
        <span className="label">Who qualifies? <span className="text-gray-500 font-normal font-mono text-[10px]">(+3 PTS)</span></span>
        <div className="grid grid-cols-2 gap-3">
          {[teamA, teamB].map((team) => (
            <label
              key={team}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-pitch-border/80 bg-pitch-deep/40 px-3.5 py-3 text-sm font-bold text-gray-300 hover:bg-pitch-deep/80 hover:text-white transition-all duration-200 has-[:checked]:border-pitch-light has-[:checked]:bg-pitch-light/10 has-[:checked]:text-white shadow-inner"
            >
              <span className="flex items-center gap-2 min-w-0">
                <CountryFlag name={team} variant="inline" />
                <span className="truncate">{team}</span>
              </span>
              <input
                type="radio"
                name="qualifierPick"
                value={team}
                defaultChecked={currentQualifier === team}
                className="h-4 w-4 accent-pitch-light cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">
          Player to score <span className="text-gray-500 font-normal font-mono text-[10px]">(+5 PTS)</span>
        </label>
        
        {/* Custom interactive dropdown button trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-pitch-border bg-pitch-deep/80 px-3.5 py-2.5 text-left text-sm font-semibold text-white outline-none focus:border-pitch-light focus:ring-2 focus:ring-pitch-light/20 transition-all hover:border-pitch-border/85"
          >
            <span className={selectedPlayer ? "text-white" : "text-gray-500 font-normal"}>
              {selectedPlayer || "Choose a player..."}
            </span>
            <span className="text-gray-400 text-xs" aria-hidden>▼</span>
          </button>
          <input
            type="hidden"
            name="scorerPick"
            value={selectedPlayer ?? ""}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="btn-primary min-w-[100px]" disabled={pending}>
          {pending ? "Saving..." : "Save Picks"}
        </button>
        {state.ok && (
          <span className="text-xs font-bold text-pitch-light animate-fade-in flex items-center gap-1">
            <span>✓</span> Saved successfully
          </span>
        )}
        {state.error && (
          <span className="text-xs font-bold text-red-400 animate-shake">
            ⚠️ {state.error}
          </span>
        )}
      </div>

      {isModalOpen && (
        <ScorerPickerModal
          squad={squad}
          selectedPlayer={selectedPlayer}
          onSelect={setSelectedPlayer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </form>
  );
}
