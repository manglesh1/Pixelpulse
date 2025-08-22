import PlayersTable from "@/features/players/components/PlayersTable";
import { getCurrentUser } from "@/features/admin/server/client";

export default async function PlayersPage() {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-6xl">
        <PlayersTable role={user?.role} />
      </div>
    </div>
  );
}
