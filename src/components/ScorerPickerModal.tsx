"use client";

import { useDeferredValue, useEffect, useState } from "react";

type Props = {
  squad: string[];
  selectedPlayer: string | null;
  onSelect: (name: string | null) => void;
  onClose: () => void;
};

export default function ScorerPickerModal({ squad, selectedPlayer, onSelect, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredSquad = normalizedQuery
    ? squad.filter((name) => name.toLowerCase().includes(normalizedQuery))
    : squad;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function closeWithSelection(name: string | null) {
    onSelect(name);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 cursor-pointer transition-all duration-300"
      onClick={onClose}
      role="button"
      tabIndex={-1}
    >
      <div
        className="card w-[90%] sm:w-[80%] max-w-md bg-pitch-card border border-pitch-border/85 p-5 flex flex-col max-h-[60vh] shadow-2xl shadow-black/90 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-pitch-border/30 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Select Scorer</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-pitch-deep border border-pitch-border hover:bg-pitch-border/50 text-gray-400 hover:text-white transition-colors text-lg font-bold"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search or type a new name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = searchQuery.trim();
                if (value) closeWithSelection(value);
              }
            }}
            className="input font-semibold"
            autoFocus
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => closeWithSelection(searchQuery.trim())}
              className="mb-2 flex w-full items-center justify-between rounded-xl border border-dashed border-pitch-light/35 bg-pitch-light/10 px-4 py-3 text-left text-xs font-bold text-pitch-light transition-all hover:bg-pitch-light/20"
            >
              <span>Use &ldquo;{searchQuery.trim()}&rdquo; as custom player</span>
              <span className="rounded border border-pitch-light/30 bg-pitch-light/20 px-2 py-0.5 text-[9px] font-mono uppercase">
                Add Custom
              </span>
            </button>
          )}

          {filteredSquad.length === 0 && !searchQuery.trim() ? (
            <div className="py-6 text-center text-xs italic text-gray-500">
              {squad.length === 0 ? "No squad roster loaded. Type player name above." : "No players match your search."}
            </div>
          ) : (
            filteredSquad.map((name) => {
              const isSelected = selectedPlayer === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => closeWithSelection(name)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all ${
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

        <div className="mt-4 space-y-2 border-t border-pitch-border/20 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-inner"
          >
            Close Window
          </button>
          {selectedPlayer && (
            <button
              type="button"
              onClick={() => closeWithSelection(null)}
              className="w-full py-1.5 text-center text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
