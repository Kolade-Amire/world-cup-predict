import { redirect } from "next/navigation";
import { getSessionPlayerId } from "@/lib/session";
import AuthForms from "@/components/AuthForms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionPlayerId()) redirect("/");
  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-xl font-extrabold">Join the challenge</h1>
        <p className="text-sm text-gray-500">Pick a name and a 4-digit PIN. That’s your login.</p>
      </div>
      <AuthForms />
    </div>
  );
}
