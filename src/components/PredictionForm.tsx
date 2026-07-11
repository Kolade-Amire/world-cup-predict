"use client";

import { useActionState, useState, useEffect } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(currentScorer);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state with parent props if they change externally
  useEffect(() => {
    setSelectedPlayer(currentScorer);
  }, [currentScorer]);

  // Disable background scrolling while modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const filteredSquad = squad.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span>{team}</span>
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
            onClick={() => {
              setSearchQuery("");
              setIsModalOpen(true);
            }}
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

      {/* Modern Overlay Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
          role="button"
          tabIndex={-1}
        >
          <div
            className="card w-[90%] sm:w-[80%] max-w-md bg-pitch-card border border-pitch-border/85 p-5 flex flex-col max-h-[60vh] shadow-2xl shadow-black/90 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pitch-border/30 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Select Scorer</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-pitch-deep border border-pitch-border hover:bg-pitch-border/50 text-gray-400 hover:text-white transition-colors text-lg font-bold"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Search Input Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search or type a new name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Prevent form submission when pressing Enter in search box
                    const val = searchQuery.trim();
                    if (val) {
                      setSelectedPlayer(val);
                      setIsModalOpen(false);
                    }
                  }
                }}
                className="input font-semibold"
                autoFocus
              />
            </div>

            {/* Scrollable Player list */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {/* Dynamic manual addition option if text is entered */}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(searchQuery.trim());
                    setIsModalOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold text-left bg-pitch-light/10 text-pitch-light border border-dashed border-pitch-light/35 hover:bg-pitch-light/20 transition-all mb-2"
                >
                  <span>Use &ldquo;{searchQuery.trim()}&rdquo; as custom player</span>
                  <span className="text-[9px] font-mono uppercase bg-pitch-light/20 px-2 py-0.5 rounded border border-pitch-light/30">Add Custom</span>
                </button>
              )}

              {filteredSquad.length === 0 && !searchQuery.trim() ? (
                <div className="text-center py-6 text-xs text-gray-500 italic">
                  {squad.length === 0 ? "No squad roster loaded. Type player name above." : "No players match your search."}
                </div>
              ) : (
                filteredSquad.map((name) => {
                  const isSelected = selectedPlayer === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(name);
                        setIsModalOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-left transition-all ${
                        isSelected
                          ? "bg-pitch-light text-white shadow-md shadow-pitch-light/10"
                          : "text-gray-300 hover:bg-pitch-border/30"
                      }`}
                    >
                      <span>{name}</span>
                      {isSelected && <span className="text-xs" aria-hidden>✓</span>}
                    </button>
                  );
                })
              )}
            </div>

            {/* Action Footer */}
            <div className="mt-4 border-t border-pitch-border/20 pt-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-ghost w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-inner"
              >
                Close Window
              </button>
              {selectedPlayer && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(null);
                    setIsModalOpen(false);
                  }}
                  className="w-full text-center text-xs font-bold text-red-400 hover:text-red-300 py-1.5 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
