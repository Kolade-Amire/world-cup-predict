"use client";

import { useActionState, useState } from "react";
import { join, login, type AuthState } from "@/app/actions/auth";

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "join">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [joinState, joinAction, joinPending] = useActionState<AuthState, FormData>(join, {});

  return (
    <div className="card p-5">
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 ${mode === "login" ? "bg-white shadow-sm text-pitch-dark" : "text-gray-500"}`}
          type="button"
        >
          Log in
        </button>
        <button
          onClick={() => setMode("join")}
          className={`rounded-lg py-2 ${mode === "join" ? "bg-white shadow-sm text-pitch-dark" : "text-gray-500"}`}
          type="button"
        >
          Join
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="login-name">Name</label>
            <input id="login-name" name="name" className="input" autoComplete="username" required />
          </div>
          <div>
            <label className="label" htmlFor="login-pin">4-digit PIN</label>
            <input
              id="login-pin"
              name="pin"
              type="password"
              className="input tracking-[0.5em]"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="current-password"
              required
            />
          </div>
          {loginState.error && <p className="text-sm font-medium text-red-600">{loginState.error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loginPending}>
            {loginPending ? "Logging in…" : "Log in"}
          </button>
        </form>
      ) : (
        <form action={joinAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="join-name">Display name</label>
            <input id="join-name" name="name" className="input" autoComplete="username" required />
            <p className="mt-1 text-xs text-gray-400">This is how you appear on the leaderboard.</p>
          </div>
          <div>
            <label className="label" htmlFor="join-pin">Choose a 4-digit PIN</label>
            <input
              id="join-pin"
              name="pin"
              type="password"
              className="input tracking-[0.5em]"
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
              className="input tracking-[0.5em]"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="new-password"
              required
            />
          </div>
          {joinState.error && <p className="text-sm font-medium text-red-600">{joinState.error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={joinPending}>
            {joinPending ? "Creating…" : "Join the challenge"}
          </button>
          <p className="text-xs text-gray-400">
            Remember your PIN — there’s no email reset. If you forget it, ask the admin.
          </p>
        </form>
      )}
    </div>
  );
}
