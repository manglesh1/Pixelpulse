import GameLocationsConfigTable from "@/features/gameLocations/components/GameLocationsConfigTable";
import { getCurrentUser } from "@/features/admin/server/user";

export default async function GameLocationsConfigPage() {
  const user = await getCurrentUser();

  return (
    <section className="p-6">
      <GameLocationsConfigTable role={user?.role} />
    </section>
  );
}
