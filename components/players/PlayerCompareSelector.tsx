"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/forms/Field";

export function PlayerCompareSelector({
  players,
}: {
  players: { id: string; name: string; jerseyNumber: number }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const a = searchParams.get("a") ?? "";
  const b = searchParams.get("b") ?? "";

  function update(key: "a" | "b", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/players/compare?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <Select value={a} onChange={(e) => update("a", e.target.value)}>
        <option value="">Select Player A…</option>
        {players.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === b}>
            #{p.jerseyNumber} {p.name}
          </option>
        ))}
      </Select>
      <Select value={b} onChange={(e) => update("b", e.target.value)}>
        <option value="">Select Player B…</option>
        {players.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === a}>
            #{p.jerseyNumber} {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
