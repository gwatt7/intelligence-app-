import { Card, CardTitle } from "@/components/ui/Card";
import type { RankedPlayer } from "@/lib/rankings";

export function RankingCard({
  title,
  players,
  unit = "",
  digits = 0,
}: {
  title: string;
  players: RankedPlayer[];
  unit?: string;
  digits?: number;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {players.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <ol className="space-y-1.5">
          {players.map((p, i) => (
            <li key={p.playerId} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                <span className="text-muted-2 mr-1.5">{i + 1}.</span>#{p.jerseyNumber} {p.name}
              </span>
              <span className="font-mono text-muted">
                {p.value.toFixed(digits)}
                {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
