"use client";

import { useActionState } from "react";
import { syncFixtures, type AdminState } from "@/app/actions/admin";

export default function SyncButton() {
  const [state, action, pending] = useActionState<AdminState, FormData>(syncFixtures, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Syncing…" : "Sync fixtures from API"}
      </button>
      {state.ok && <span className="text-sm font-medium text-pitch">{state.ok}</span>}
      {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
