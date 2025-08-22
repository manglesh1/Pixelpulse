import PlayerScoresTable from "@/features/playerScores/components/PlayerScoresTable";
import { getCurrentUser } from "@/features/admin/server/client";

export default async function PlayerScoresPage() {
  const user = await getCurrentUser();

  return (
    <section className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Player Scores</h1>
        <p className="text-sm text-muted-foreground">
          Browse, filter, and manage scores across games & variants.
        </p>
      </div>

      <PlayerScoresTable role={user?.role} />
    </section>
  );
}
