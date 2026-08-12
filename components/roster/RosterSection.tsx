"use client";

import { useState, useTransition } from "react";
import { deletePlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/forms/PlayerForm";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  shoots: "LEFT" | "RIGHT" | null;
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
};

const POSITION_LABEL: Record<Player["position"], string> = {
  FORWARD: "Forward",
  DEFENSE: "Defense",
  GOALIE: "Goalie",
};

export function RosterSection({ seasonId, players }: { seasonId: string; players: Player[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(player: Player) {
    if (!confirm(`Remove ${player.firstName} ${player.lastName} (#${player.jerseyNumber}) from the roster? This also removes their practice and game stats.`)) {
      return;
    }
    startTransition(async () => {
      await deletePlayer(player.id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Roster ({players.length})</h2>
        {!adding && <Button onClick={() => setAdding(true)}>+ Add Player</Button>}
      </div>

      {adding && (
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <PlayerForm seasonId={seasonId} onDone={() => setAdding(false)} />
        </div>
      )}

      {players.length === 0 && !adding ? (
        <EmptyState title="No players yet" description="Add your first player to get started." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Position</Th>
              <Th>Shoots</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <TBody>
            {players.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="bg-surface-raised">
                  <td colSpan={6} className="p-4">
                    <PlayerForm seasonId={seasonId} playerId={p.id} defaults={p} onDone={() => setEditingId(null)} />
                  </td>
                </tr>
              ) : (
                <Tr key={p.id}>
                  <Td className="font-mono text-muted">#{p.jerseyNumber}</Td>
                  <Td>
                    <Link href={`/players/${p.id}`} className="text-foreground hover:text-accent-strong font-medium">
                      {p.firstName} {p.lastName}
                    </Link>
                  </Td>
                  <Td className="text-muted">{POSITION_LABEL[p.position]}</Td>
                  <Td className="text-muted">{p.shoots ? (p.shoots === "LEFT" ? "Left" : "Right") : "—"}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEditingId(p.id)}>
                        Edit
                      </Button>
                      <Button variant="ghost" className="text-negative" disabled={pending} onClick={() => handleDelete(p)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              )
            )}
          </TBody>
        </Table>
      )}
    </div>
  );
}
