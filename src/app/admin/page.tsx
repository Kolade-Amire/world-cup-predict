import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { utcToWatInput } from "@/lib/time";
import { adminLogout } from "@/app/actions/admin";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminMatchEditor from "@/components/AdminMatchEditor";
import SyncButton from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold">Admin</h1>
        <p className="text-sm text-gray-500">Enter the admin password to manage fixtures and results.</p>
        <AdminLoginForm />
      </div>
    );
  }

  const matches = await prisma.match.findMany({
    orderBy: { order: "asc" },
    include: { goals: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Admin · fixtures &amp; results</h1>
        <form action={adminLogout}>
          <button className="text-sm font-semibold text-gray-500 hover:underline" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <div className="card space-y-2 p-4">
        <SyncButton />
        <p className="text-xs text-gray-400">
          Pulls teams, kickoff times and qualifiers from football-data.org (needs <code>FOOTBALL_DATA_API_KEY</code>). Goal
          scorers are entered manually below. If the API doesn’t cover this tournament, fill matches in by hand instead.
        </p>
      </div>

      <p className="px-1 text-xs text-gray-400">
        Set teams + kickoff (in WAT) to open a match. After it’s played, enter the qualifier and scorers — points update
        instantly.
      </p>

      {matches.map((m) => (
        <AdminMatchEditor
          key={m.id}
          id={m.id}
          code={m.code}
          round={m.round}
          teamA={m.teamA}
          teamB={m.teamB}
          kickoffInput={m.kickoff ? utcToWatInput(m.kickoff) : ""}
          qualifier={m.qualifier}
          scorers={m.goals.map((g) => g.scorer).join("\n")}
        />
      ))}
    </div>
  );
}
