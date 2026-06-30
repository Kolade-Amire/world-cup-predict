"use client";

import { useActionState } from "react";
import { adminLogin, type AdminState } from "@/app/actions/admin";

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(adminLogin, {});
  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <label className="label" htmlFor="admin-pw">Admin password</label>
        <input id="admin-pw" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : "Enter admin"}
      </button>
    </form>
  );
}
