"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Periodically re-fetches the current server-rendered page so results/leaderboard update
// without a manual reload. Cheap because pages are dynamic and data sets are tiny.
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
