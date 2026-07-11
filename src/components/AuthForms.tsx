"use client";

import { useActionState, useState } from "react";
import { join, login, type AuthState } from "@/app/actions/auth";

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "join">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [joinState, joinAction, joinPending] = useActionState<AuthState, FormData>(join, {});

  return (
    <div className="card p-6 bg-pitch-card max-w-md mx-auto">
      {/* Mode Switcher */}
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-pitch-deep/90 p-1 text-sm font-bold border border-pitch-border/60">
        <button
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 transition-all duration-200 ${
            mode === "login"
              ? "bg-pitch-light text-white shadow-md shadow-pitch-light/10"
              : "text-gray-400 hover:text-gray-200"
          }`}
          type="button"
        >
          Log in
        </button>
        <button
          onClick={() => setMode("join")}
          className={`rounded-lg py-2 transition-all duration-200 ${
            mode === "join"
              ? "bg-pitch-light text-white shadow-md shadow-pitch-light/10"
              : "text-gray-400 hover:text-gray-200"
          }`}
          type="button"
        >
          Join
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="login-name">Display Name</label>
            <input
              id="login-name"
              name="name"
              placeholder="e.g. Victor"
              className="input font-semibold"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="login-pin">4-Digit PIN</label>
            <input
              id="login-pin"
              name="pin"
              type="password"
              placeholder="••••"
              className="input text-center tracking-[0.6em] font-mono text-lg"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="current-password"
              required
            />
          </div>
          {loginState.error && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 animate-shake">
              ⚠️ {loginState.error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={loginPending}>
            {loginPending ? "Checking Credentials..." : "Access Challenge"}
          </button>
        </form>
      ) : (
        <form action={joinAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="join-name">Display Name</label>
            <input
              id="join-name"
              name="name"
              placeholder="e.g. Victor"
              className="input font-semibold"
              autoComplete="username"
              required
            />
            <p className="mt-1.5 text-[10px] text-gray-500 font-medium">This is how your name will appear on the leaderboard table.</p>
          </div>
          <div>
            <label className="label" htmlFor="join-pin">Choose 4-Digit PIN</label>
            <input
              id="join-pin"
              name="pin"
              type="password"
              placeholder="••••"
              className="input text-center tracking-[0.6em] font-mono text-lg"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="join-confirm">Confirm PIN</label>
            <input
              id="join-confirm"
              name="confirm"
              type="password"
              placeholder="••••"
              className="input text-center tracking-[0.6em] font-mono text-lg"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="new-password"
              required
            />
          </div>
          {joinState.error && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 animate-shake">
              ⚠️ {joinState.error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3" disabled={joinPending}>
            {joinPending ? "Registering..." : "Create Account"}
          </button>
          <p className="text-[10px] text-gray-500 leading-relaxed text-center font-medium">
            🔒 Remember your PIN. There is no email recovery setup. If you forget your code, ask the administrator to reset it.
          </p>
        </form>
      )}
    </div>
  );
}
